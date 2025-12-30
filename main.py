import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from pydantic import BaseModel
from typing import Optional
from transformers import AutoProcessor, AutoModel
from PIL import Image
import torch
import io
import time

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Global state
class ModelState:
    def __init__(self):
        self.model = None
        self.processor = None
        self.model_id = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

state = ModelState()

class LoadModelRequest(BaseModel):
    model_id: str
    use_gpu: bool

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/load_model")
async def load_model(request: LoadModelRequest):
    try:
        # Determine device
        device = "cuda" if request.use_gpu and torch.cuda.is_available() else "cpu"
        
        # Map Xenova IDs to HuggingFace IDs if necessary
        # Xenova/siglip... -> google/siglip...
        hf_model_id = request.model_id
        if "Xenova/siglip" in hf_model_id:
            hf_model_id = hf_model_id.replace("Xenova/", "google/")
        elif "Xenova/clip" in hf_model_id:
            hf_model_id = hf_model_id.replace("Xenova/", "openai/") # Approximate mapping
            
        print(f"Loading model: {hf_model_id} on {device}")
        
        state.processor = AutoProcessor.from_pretrained(hf_model_id)
        state.model = AutoModel.from_pretrained(hf_model_id).to(device)
        state.model_id = request.model_id
        state.device = device
        
        return {"status": "success", "message": "Model loaded successfully"}
    except Exception as e:
        print(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
async def predict(
    image_source: str = Form("Image"),
    text_source: str = Form("Text"),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    if not state.model or not state.processor:
        raise HTTPException(status_code=400, detail="Model not loaded")

    try:
        start_time = time.time()
        
        # Helper to normalize
        def normalize(t):
             return t / t.norm(dim=-1, keepdim=True)

        text_embeds = None
        image_embeds = None

        # Image Processing
        if image_source == "Random":
            # Generate random vector
            # We need to know embedding dimension.
            # Try to infer from model config or run a dummy pass? 
            # Or just use model.config.projection_dim if available. 
            # Let's rely on running a dummy pass or known dimensions if possible, 
            # OR simpler: check if we can get it from state.model.config
            
            dim = 512 # Default CLIP/SigLIP base
            if hasattr(state.model, "config"):
                if hasattr(state.model.config, "projection_dim"):
                    dim = state.model.config.projection_dim
                elif hasattr(state.model.config, "hidden_size"):
                    # careful, hidden_size might not be projection dim
                    dim = state.model.config.hidden_size
            
            # Generate random normal vector
            image_embeds = torch.randn(1, dim).to(state.device)
            image_embeds = normalize(image_embeds)
            
        elif image_source == "Image" and image:
            # Read image
            image_data = await image.read()
            raw_image = Image.open(io.BytesIO(image_data)).convert("RGB")
            
            # Process inputs just for image
            # Note: processor usually handles both, but we can pass just images
            img_inputs = state.processor(images=raw_image, return_tensors="pt").to(state.device)
            
            with torch.no_grad():
                img_outputs = state.model.get_image_features(**img_inputs)
            
            image_embeds = normalize(img_outputs)
        
        # Text Processing
        if text_source == "Random":
            # Similar logic for text
            dim = 512
            if hasattr(state.model, "config"):
                if hasattr(state.model.config, "projection_dim"):
                    dim = state.model.config.projection_dim
                elif hasattr(state.model.config, "hidden_size"):
                    dim = state.model.config.hidden_size
                    
            text_embeds = torch.randn(1, dim).to(state.device)
            text_embeds = normalize(text_embeds)
            
        elif text_source == "Text" and text:
            # Process text
            text_inputs = state.processor(text=[text], padding="max_length", truncation=True, return_tensors="pt").to(state.device)
            
            with torch.no_grad():
                text_outputs = state.model.get_text_features(**text_inputs)
            
            text_embeds = normalize(text_outputs)

        if text_embeds is not None and image_embeds is not None:
            # Cosine similarity is dot product of normalized vectors
            similarity = (text_embeds @ image_embeds.T).item()
        else:
             raise HTTPException(status_code=500, detail="Could not compute embeddings for selected sources.")
        
        # Old logic fallback removed/simplified since we use specific features API
        pass

        end_time = time.time()
        duration_ms = (end_time - start_time) * 1000
        
        return {
            "score": similarity,
            "time": duration_ms
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
