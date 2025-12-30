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
    text: str = Form(...),
    image: UploadFile = File(...)
):
    if not state.model or not state.processor:
        raise HTTPException(status_code=400, detail="Model not loaded")

    try:
        start_time = time.time()
        
        # Read image
        image_data = await image.read()
        raw_image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Process inputs
        inputs = state.processor(
            text=[text],
            images=raw_image,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        ).to(state.device)
        
        # Inference
        with torch.no_grad():
            outputs = state.model(**inputs)
        
        # Calculate similarity (Cosine Similarity)
        # SigLIP/CLIP: normalize embeddings then dot product
        
        # Helper to normalize
        def normalize(t):
            return t / t.norm(dim=-1, keepdim=True)

        if hasattr(outputs, 'text_embeds') and hasattr(outputs, 'image_embeds'):
            text_embeds = normalize(outputs.text_embeds)
            image_embeds = normalize(outputs.image_embeds)
            
            # Cosine similarity is dot product of normalized vectors
            similarity = (text_embeds @ image_embeds.T).item()
        
        # Some models use different output names or logits
        elif hasattr(outputs, 'logits_per_image'):
             # For CLIP, logits_per_image is (image_batch, text_batch)
             # We can use sigmoid(logits) on SigLIP or softmax on CLIP, but users usually want cosine sim.
             # However, raw embeddings are safer if available.
             # Let's try to extract embeddings from last_hidden_state if specific heads aren't available, 
             # but usually AutoModel for CLIP/SigLIP returns embeds.
             
             # Fallback logic if needed, but standard SigLIP/CLIP models return embeds
             raise HTTPException(status_code=500, detail="Model output format not supported (missing text/image embeds)")
             
        else:
             # Fallback for models that might compute logits directly
             raise HTTPException(status_code=500, detail="Model output format not supported")

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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
