from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models.schemas import LoadModelRequest, ImagePredictionResponse, VideoAnalysisResponse, FrameResult, ErrorResponse
from app.services.vlm_engine import VLMService
from app.services.video_processing import extract_frames
from app.core.state import state
import time
import io
import tempfile
import os
from PIL import Image

router = APIRouter()

@router.post("/load_model")
async def load_model(request: LoadModelRequest):
    try:
        msg = VLMService.load_model(request.model_id, request.use_gpu)
        return {"status": "success", "message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=None) # We return distinct types, so response_model Union is tricky or just dict
async def predict(
    image_source: str = Form("Image"),
    text_source: str = Form("Text"),
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None)
):
    if not state.has_model():
        raise HTTPException(status_code=400, detail="Model not loaded")

    start_time = time.time()
    
    try:
        text_embeds = None
        image_embeds = None
        
        # 1. Process Video if needed
        if image_source == "Video":
            if not video:
                 raise HTTPException(status_code=400, detail="Video file required for Video source")
                 
            # Save temp file
            # Ideally use a service for temp file management if possible, but keep it simple
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                content = await video.read()
                tmp.write(content)
                tmp_path = tmp.name
                
            try:
                frames, timestamps = extract_frames(tmp_path, fps=1)
                
                if not frames:
                     raise HTTPException(status_code=400, detail="Could not extract frames from video")

                # Prepare Text Embed
                if text_source == "Text" and text:
                     text_embeds = VLMService.get_text_embedding(text)
                elif text_source == "Random":
                     text_embeds = VLMService.get_random_embedding()
                else:
                     raise HTTPException(status_code=400, detail="Valid text source required")
                
                # Batch Process Frames
                video_results = []
                batch_size = 4
                
                for i in range(0, len(frames), batch_size):
                    batch_frames = frames[i:i+batch_size]
                    batch_embeds = VLMService.get_batch_image_embeddings(batch_frames)
                    
                    # Sim: [1, D] @ [B, D].T -> [1, B]
                    sims = (text_embeds @ batch_embeds.T).squeeze(0).cpu().numpy()
                    
                    if len(batch_frames) == 1:
                        # squeeze might return scalar if B=1? No, squeeze(0) on [1, 1] -> [1]
                        # Wait, torch behavior
                        # [1, D] @ [1, D].T -> [1, 1]. squeeze(0) -> [1].
                        if sims.ndim == 0:
                            sims = [float(sims)]
                        else:
                            sims = [float(sims)]
                    else:
                        sims = [float(s) for s in sims]
                        
                    for j, s in enumerate(sims):
                        idx = i + j
                        if idx < len(timestamps):
                            video_results.append(FrameResult(time=timestamps[idx], score=max(-1.0, min(1.0, s))))

                end_time = time.time()
                duration_ms = (end_time - start_time) * 1000
                
                best_frame = max(video_results, key=lambda x: x.score) if video_results else None
                avg_score = sum(r.score for r in video_results) / len(video_results) if video_results else 0.0
                
                return VideoAnalysisResponse(
                    frames=video_results,
                    average_score=avg_score,
                    best_frame=best_frame,
                    time=duration_ms
                )

            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)
        
        # 2. Process Image (Single)
        else:
            # Handle Image Embed
            if image_source == "Random":
                image_embeds = VLMService.get_random_embedding()
            elif image_source == "Image" and image:
                content = await image.read()
                raw_image = Image.open(io.BytesIO(content)).convert("RGB")
                image_embeds = VLMService.get_image_embedding(raw_image)
            else:
                 raise HTTPException(status_code=400, detail="Valid image source required")

            # Handle Text Embed
            if text_source == "Text" and text:
                text_embeds = VLMService.get_text_embedding(text)
            elif text_source == "Random":
                 text_embeds = VLMService.get_random_embedding()
            else:
                 raise HTTPException(status_code=400, detail="Valid text source required")
            
            # Compute Sim
            sim, angle = VLMService.compute_similarity(text_embeds, image_embeds)
            
            end_time = time.time()
            duration_ms = (end_time - start_time) * 1000
            
            return ImagePredictionResponse(
                score=sim,
                angle=angle,
                time=duration_ms
            )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
