from app.core.state import state
from app.services.video_processing import extract_frames
from transformers import AutoProcessor, AutoModel
import torch
from PIL import Image
import math
import io
import tempfile
import os
import numpy as np
from typing import Optional, List, Union, Tuple, Any
import torch.distributions as dist
from app.models.schemas import GenericAnalysisResponse, FrameResult, SimilarityMatrix

class VLMService:
    @staticmethod
    def load_model(model_id: str, use_gpu: bool) -> str:
        """
        Loads the model into the global state.
        Returns message or raises exception.
        """
        try:
            device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
            
            hf_model_id = model_id

            if "Xenova/clip" in hf_model_id:
                hf_model_id = hf_model_id.replace("Xenova/", "openai/")

            print(f"Loading model: {hf_model_id} on {device}")
            
            state.processor = AutoProcessor.from_pretrained(hf_model_id)
            state.model = AutoModel.from_pretrained(hf_model_id).to(device)
            state.model_id = model_id
            state.device = device
            
            return f"Model {model_id} loaded successfully on {device}"
        except Exception as e:
            print(f"Error loading model: {e}")
            raise e

    @staticmethod
    def reparameterize(t: torch.Tensor, sigma: float = 0.0) -> torch.Tensor:
        """
        Applies reparameterization trick: z = t + sigma * epsilon
        epsilon ~ N(0, I)
        """
        if sigma <= 0:
            return t
        
        epsilon = torch.randn_like(t)
        return t + sigma * epsilon

    @staticmethod
    def normalize(t: torch.Tensor) -> torch.Tensor:
        return t / t.norm(dim=-1, keepdim=True)

    @staticmethod
    def get_text_embedding(text: str, use_pooler_output: bool = False, sigma: float = 0.0) -> torch.Tensor:
        if not state.has_model():
            raise RuntimeError("Model not loaded")
            
        text_inputs = state.processor(text=[text], padding="max_length", truncation=True, return_tensors="pt").to(state.device)
        with torch.no_grad():
            if use_pooler_output:
                # Try to access the underlying text model for pooler output
                if hasattr(state.model, "text_model"):
                    outputs = state.model.text_model(**text_inputs)
                    # getattr to be safe, though pooler_output should exist for CLIP-like
                    embeds = getattr(outputs, "pooler_output", outputs.last_hidden_state[:, 0, :]) 
                else:
                    # Fallback or error if structure is different
                    print("Warning: Model does not have text_model attribute, falling back to projected features")
                    embeds = state.model.get_text_features(**text_inputs)
            else:
                embeds = state.model.get_text_features(**text_inputs)
        
        embeds = VLMService.reparameterize(embeds, sigma)
        return VLMService.normalize(embeds)

    @staticmethod
    def get_image_embedding(image: Image.Image, sigma: float = 0.0) -> torch.Tensor:
        if not state.has_model():
            raise RuntimeError("Model not loaded")

        img_inputs = state.processor(images=image, return_tensors="pt").to(state.device)
        with torch.no_grad():
            img_outputs = state.model.get_image_features(**img_inputs)
            
        img_outputs = VLMService.reparameterize(img_outputs, sigma)
        return VLMService.normalize(img_outputs)

    @staticmethod
    def get_batch_image_embeddings(images: List[Image.Image], sigma: float = 0.0) -> torch.Tensor:
        if not state.has_model():
            raise RuntimeError("Model not loaded")

        # Process in one go or batch?
        # The original code did manual batching. We'll support batching here or let caller batch.
        # Let's do batch processing here if list is provided.
        # But for huge lists, caller should chunk. 
        # For simplicity, we assume caller passes a safe batch or we just process all (the original code batched)
        
        # We will return [B, D]
        inputs = state.processor(images=images, return_tensors="pt").to(state.device)
        with torch.no_grad():
            outputs = state.model.get_image_features(**inputs)
            
        outputs = VLMService.reparameterize(outputs, sigma)
        return VLMService.normalize(outputs)

    @staticmethod
    def get_random_embedding(dim: int = 512, sigma: float = 0.0) -> torch.Tensor:
        # Try to infer dim from model if loaded
        if state.has_model():
            if hasattr(state.model, "config"):
                if hasattr(state.model.config, "projection_dim"):
                    dim = state.model.config.projection_dim
                elif hasattr(state.model.config, "hidden_size"):
                    dim = state.model.config.hidden_size
        
        embed = torch.randn(1, dim).to(state.device)
        # Random embedding is already "random", but we can still reparameterize if requested (though moot)
        if sigma > 0:
             embed = VLMService.reparameterize(embed, sigma)
             
        return VLMService.normalize(embed)

    @staticmethod
    def compute_similarity(embed1: torch.Tensor, embed2: torch.Tensor) -> Tuple[float, float]:
        """
        Computes cosine similarity and angle between two normalized embeddings.
        Returns: (similarity_score, angle_degrees)
        """
        # embed1: [1, D], embed2: [1, D] (or [N, D] but expecting 1 for this method)
        
        sim = (embed1 @ embed2.T).item()
        sim_clamped = max(-1.0, min(1.0, sim))
        angle_rad = math.acos(sim_clamped)
        angle_deg = math.degrees(angle_rad)
        return sim, angle_deg

    @staticmethod
    def compute_similarity_matrix(embeds_a: torch.Tensor, embeds_b: torch.Tensor) -> np.ndarray:
        """
        Computes similarity matrix [N, M]
        embeds_a: [N, D]
        embeds_b: [M, D]
        """
        # [N, D] @ [M, D].T -> [N, M]
        sim_matrix = (embeds_a @ embeds_b.T).cpu().numpy()
        return sim_matrix

    @staticmethod
    async def process_source(
        source_type: str,
        text: Optional[str],
        image_bytes: Optional[bytes],
        video_path: Optional[str],
        sigma: float,
        text_embed_type: str,
        video_fps: float,
        batch_size: int = 4
    ) -> Tuple[torch.Tensor, Optional[List[float]], bool]:
        """
        Process any source type and return embeddings.
        
        Args:
            source_type: One of "Text", "Image", "Video", "Random"
            text: Text content (for Text source)
            image_bytes: Raw bytes of image (for Image source)
            video_path: Path to video file (server path or local temp path) (for Video source)
            sigma: Reparameterization sigma
            text_embed_type: "projected" or "pooler_output"
            video_fps: Frames per second for video sampling
            batch_size: Batch size for video frame processing
            
        Returns:
            Tuple of (embeddings, timestamps, is_video)
        """
        embeds = None
        timestamps = None
        is_video = False
        
        if source_type == "Text":
            if not text:
                raise SourceValidationError("Text required for Text source")
            use_pooler = (text_embed_type == "pooler_output")
            embeds = VLMService.get_text_embedding(text, use_pooler_output=use_pooler, sigma=sigma)
        
        elif source_type == "Image":
            if not image_bytes:
                raise SourceValidationError("Image file content required for Image source")
            raw_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            embeds = VLMService.get_image_embedding(raw_image, sigma=sigma)
        
        elif source_type == "Video":
            is_video = True
            
            if not video_path:
                 raise SourceValidationError("Video path required for Video source")

            # Check if it looks like a server path (we might need to resolve it here if endpoints passed a raw server path string,
            # BUT better design is endpoints resolves it OR we rely on resolve_path helper. 
            # The previous logic had resolving logic inside. Let's keep resolving logic if it fails to exist? 
            # Actually, the endpoints should probably pass a valid path. 
            # BUT previously `server_path` param was passed. Now `video_path` is passed.
            # If `video_path` is a temp file, it exists. 
            # If `video_path` is a server path string like "--foo.mp4", it needs resolving.
            
            # We can use a helper to check if file exists, if not, try to resolve as server path.
            final_path = video_path
            if not os.path.exists(final_path):
                 # Try to resolve as server path
                from app.services.video_browser_service import VideoBrowserService
                from app.services.qvhighlights_service import QVHighlightsService
                
                resolved_path = VideoBrowserService.get_video_path(video_path)
                if not resolved_path:
                    # Try QVHighlights as fallback (for vid)
                    resolved_path = QVHighlightsService.get_video_path(video_path)
                
                if not resolved_path:
                    raise SourceValidationError(f"Video not found: {video_path}")
                final_path = str(resolved_path)
            
            frames, timestamps = extract_frames(final_path, fps=video_fps)
            if not frames:
                raise VideoProcessingError("Could not extract frames from video")
            
            # Batch process frames
            all_embeds_list = []
            for i in range(0, len(frames), batch_size):
                batch = frames[i:i+batch_size]
                batch_emb = VLMService.get_batch_image_embeddings(batch, sigma=sigma)
                all_embeds_list.append(batch_emb)
            
            if all_embeds_list:
                embeds = torch.cat(all_embeds_list, dim=0)
            else:
                # Fallback: infer embedding dimension from model config
                dim = 512
                if state.has_model() and hasattr(state.model, "config"):
                    if hasattr(state.model.config, "projection_dim"):
                        dim = state.model.config.projection_dim
                embeds = torch.empty(0, dim).to(state.device)

        elif source_type == "Random":
            embeds = VLMService.get_random_embedding(sigma=sigma)
        
        else:
            raise UnknownSourceTypeError(f"Unknown source type: {source_type}")
            
        return embeds, timestamps, is_video

    @staticmethod
    def compute_generic_similarity(
        embeds_a: torch.Tensor,
        embeds_b: torch.Tensor,
        timestamps_a: Optional[List[float]],
        timestamps_b: Optional[List[float]],
        is_video_a: bool,
        is_video_b: bool
    ) -> Tuple[str, Optional[float], Optional[List[FrameResult]], Optional[SimilarityMatrix], Optional[FrameResult], Optional[float]]:
        """
        Dispatches to scalar/curve/matrix based on input types.
        
        Returns:
            Tuple of (res_type, score, curve, matrix, best_frame, avg_score)
        """
        res_type = "scalar"
        score = None
        curve = None
        matrix = None
        best_frame = None
        avg_score = None
        
        # Case 1: Video vs Video -> Matrix
        if is_video_a and is_video_b:
            res_type = "matrix"
            sim_mat = VLMService.compute_similarity_matrix(embeds_a, embeds_b)
            matrix = SimilarityMatrix(
                matrix=sim_mat.tolist(),
                rows_time=timestamps_a,
                cols_time=timestamps_b
            )
            avg_score = float(sim_mat.mean())
            
        # Case 2: Video vs Static -> Curve over Video
        elif is_video_a and not is_video_b:
            res_type = "curve"
            # [Na, D] @ [1, D].T -> [Na, 1]
            sims = (embeds_a @ embeds_b.T).squeeze(1).cpu().numpy()
            
            curve_results = []
            for i, s in enumerate(sims):
                curve_results.append(FrameResult(time=timestamps_a[i], score=max(-1.0, min(1.0, float(s)))))
            
            curve = curve_results
            best_frame = max(curve, key=lambda x: x.score) if curve else None
            avg_score = sum(r.score for r in curve) / len(curve) if curve else 0.0

        # Case 3: Static vs Video -> Curve over Video
        elif not is_video_a and is_video_b:
            res_type = "curve"
            # [1, D] @ [Nb, D].T -> [1, Nb]
            sims = (embeds_a @ embeds_b.T).squeeze(0).cpu().numpy()
            
            curve_results = []
            for i, s in enumerate(sims):
                curve_results.append(FrameResult(time=timestamps_b[i], score=max(-1.0, min(1.0, float(s)))))
            
            curve = curve_results
            best_frame = max(curve, key=lambda x: x.score) if curve else None
            avg_score = sum(r.score for r in curve) / len(curve) if curve else 0.0
            
        # Case 4: Static vs Static -> Scalar
        else:
            res_type = "scalar"
            s, _ = VLMService.compute_similarity(embeds_a, embeds_b)
            score = s
            
        return res_type, score, curve, matrix, best_frame, avg_score
