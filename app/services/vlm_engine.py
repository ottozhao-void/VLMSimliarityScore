from app.core.state import state
from transformers import AutoProcessor, AutoModel
import torch
from PIL import Image
import math
from typing import Optional, List, Union, Tuple
import numpy as np
import torch.distributions as dist

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
            # if "Xenova/siglip" in hf_model_id:
            #     hf_model_id = hf_model_id.replace("Xenova/", "google/")
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
