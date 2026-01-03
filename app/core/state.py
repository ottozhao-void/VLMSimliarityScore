import torch
from transformers import AutoProcessor, AutoModel

class ModelState:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelState, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.processor = None
            cls._instance.model_id = None
            cls._instance.device = "cuda" if torch.cuda.is_available() else "cpu"
        return cls._instance

    def has_model(self) -> bool:
        return self.model is not None and self.processor is not None

# Global instance
state = ModelState()
