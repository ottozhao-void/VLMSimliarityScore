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
import math

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

    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

import cv2
import tempfile
import os
import numpy as np

def extract_frames(video_path, fps=1):
    """Extracts frames from video at specified FPS."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return [], []
    
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / video_fps
    
    frames = []
    timestamps = []
    
    # Calculate interval in frames
    interval = int(video_fps / fps)
    if interval < 1: interval = 1
    
    current_frame = 0
    while True:
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert BGR to RGB (OpenCV uses BGR)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(Image.fromarray(frame_rgb))
        timestamps.append(current_frame / video_fps)
        
        current_frame += interval
        
    cap.release()
    return frames, timestamps

@app.post("/api/predict")
async def predict(
    image_source: str = Form("Image"),
    text_source: str = Form("Text"),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None)
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
        
        # Video Processing
        video_results = []
        is_video = False
        
        if image_source == "Video" and video:
            is_video = True
            # Save temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                tmp.write(await video.read())
                tmp_path = tmp.name
            
            try:
                # Extract frames
                frames, timestamps = extract_frames(tmp_path, fps=1)
                
                if not frames:
                     raise HTTPException(status_code=400, detail="Could not extract frames from video")

                # Process text first to have it ready
                if text_source == "Text" and text:
                    text_inputs = state.processor(text=[text], padding="max_length", truncation=True, return_tensors="pt").to(state.device)
                    with torch.no_grad():
                        text_outputs = state.model.get_text_features(**text_inputs)
                    text_embeds = normalize(text_outputs)
                elif text_source == "Random":
                     # ... existing random text logic ...
                    dim = 512
                    if hasattr(state.model, "config"):
                        if hasattr(state.model.config, "projection_dim"):
                            dim = state.model.config.projection_dim
                        elif hasattr(state.model.config, "hidden_size"):
                            dim = state.model.config.hidden_size
                    text_embeds = normalize(torch.randn(1, dim).to(state.device))
                
                if text_embeds is None:
                     raise HTTPException(status_code=400, detail="Text source required for video analysis")
                
                # Process frames in batches
                batch_size = 4
                all_scores = []
                
                for i in range(0, len(frames), batch_size):
                    batch_frames = frames[i:i+batch_size]
                    batch_inputs = state.processor(images=batch_frames, return_tensors="pt").to(state.device)
                    
                    with torch.no_grad():
                        batch_outputs = state.model.get_image_features(**batch_inputs)
                    
                    batch_embeds = normalize(batch_outputs)
                    
                    # Compute similarity for this batch
                    # text_embeds: [1, D], batch_embeds: [B, D] -> [1, B]
                    sims = (text_embeds @ batch_embeds.T).squeeze(0).cpu().numpy()
                    
                    if len(batch_frames) == 1:
                        all_scores.append(float(sims))
                    else:
                        all_scores.extend([float(s) for s in sims])

                # Construct results
                for t, s in zip(timestamps, all_scores):
                     video_results.append({"time": t, "score": max(-1.0, min(1.0, s))})
                     
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
            
            end_time = time.time()
            duration_ms = (end_time - start_time) * 1000
            
            # Find best frame
            best_frame = max(video_results, key=lambda x: x['score']) if video_results else None
            avg_score = sum(r['score'] for r in video_results) / len(video_results) if video_results else 0
            
            return {
                "type": "video",
                "frames": video_results,
                "average_score": avg_score,
                "best_frame": best_frame,
                "time": duration_ms
            }

        # Image Processing (Existing Logic)
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
            
            # Clamp similarity to [-1, 1] to avoid domain errors
            similarity_clamped = max(-1.0, min(1.0, similarity))
            angle_rad = math.acos(similarity_clamped)
            angle_deg = math.degrees(angle_rad)
        else:
             raise HTTPException(status_code=500, detail="Could not compute embeddings for selected sources.")
        
        # Old logic fallback removed/simplified since we use specific features API
        pass

        end_time = time.time()
        duration_ms = (end_time - start_time) * 1000
        
        return {
            "score": similarity,
            "angle": angle_deg,
            "time": duration_ms
        }
        
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
