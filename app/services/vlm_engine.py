from app.core.state import state
from transformers import AutoProcessor, AutoModel
import torch
from PIL import Image
import math
from typing import Optional, List, Union, Tuple
import numpy as np

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
    def normalize(t: torch.Tensor) -> torch.Tensor:
        return t / t.norm(dim=-1, keepdim=True)

    @staticmethod
    def get_text_embedding(text: str) -> torch.Tensor:
        if not state.has_model():
            raise RuntimeError("Model not loaded")
            
        text_inputs = state.processor(text=[text], padding="max_length", truncation=True, return_tensors="pt").to(state.device)
        with torch.no_grad():
            text_outputs = state.model.get_text_features(**text_inputs)
        return VLMService.normalize(text_outputs)

    @staticmethod
    def get_image_embedding(image: Image.Image) -> torch.Tensor:
        if not state.has_model():
            raise RuntimeError("Model not loaded")

        img_inputs = state.processor(images=image, return_tensors="pt").to(state.device)
        with torch.no_grad():
            img_outputs = state.model.get_image_features(**img_inputs)
        return VLMService.normalize(img_outputs)

    @staticmethod
    def get_batch_image_embeddings(images: List[Image.Image]) -> torch.Tensor:
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
        return VLMService.normalize(outputs)

    @staticmethod
    def get_random_embedding(dim: int = 512) -> torch.Tensor:
        # Try to infer dim from model if loaded
        if state.has_model():
            if hasattr(state.model, "config"):
                if hasattr(state.model.config, "projection_dim"):
                    dim = state.model.config.projection_dim
                elif hasattr(state.model.config, "hidden_size"):
                    dim = state.model.config.hidden_size
        
        embed = torch.randn(1, dim).to(state.device)
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
