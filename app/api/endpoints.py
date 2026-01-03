from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models.schemas import LoadModelRequest, GenericAnalysisResponse, FrameResult, SimilarityMatrix, ErrorResponse
from app.services.vlm_engine import VLMService
from app.services.video_processing import extract_frames
from app.core.state import state
import torch
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

@router.post("/predict", response_model=GenericAnalysisResponse)
async def predict(
    source_a_type: str = Form(...),
    source_b_type: str = Form(...),
    source_a_text: Optional[str] = Form(None),
    source_b_text: Optional[str] = Form(None),
    source_a_file: Optional[UploadFile] = File(None),
    source_b_file: Optional[UploadFile] = File(None),
    reparam_sigma_a: float = Form(0.0),
    reparam_sigma_b: float = Form(0.0),
    text_embed_type_a: str = Form("projected"),  # "projected" or "pooler_output"
    text_embed_type_b: str = Form("projected"),   # "projected" or "pooler_output"
    video_fps: int = Form(1)  # Frames per second for video sampling
):
    if not state.has_model():
        raise HTTPException(status_code=400, detail="Model not loaded")

    start_time = time.time()
    temp_files = []
    
    try:
        # Helper to get embeddings
        async def get_embeddings(source_type: str, text_val: Optional[str], file_val: Optional[UploadFile], sigma: float, text_embed_type: str):
            embeds = None
            timestamps = None
            is_video = False
            
            if source_type == "Text":
                if not text_val:
                    raise HTTPException(status_code=400, detail="Text required for Text source")
                use_pooler = (text_embed_type == "pooler_output")
                embeds = VLMService.get_text_embedding(text_val, use_pooler_output=use_pooler, sigma=sigma)
            
            elif source_type == "Image":
                if not file_val:
                     raise HTTPException(status_code=400, detail="Image file required for Image source")
                content = await file_val.read()
                raw_image = Image.open(io.BytesIO(content)).convert("RGB")
                embeds = VLMService.get_image_embedding(raw_image, sigma=sigma)
            
            elif source_type == "Video":
                if not file_val:
                     raise HTTPException(status_code=400, detail="Video file required for Video source")
                is_video = True
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
                    content = await file_val.read()
                    tmp.write(content)
                    tmp_path = tmp.name
                    temp_files.append(tmp_path)
                
                frames, timestamps = extract_frames(tmp_path, fps=video_fps)
                if not frames:
                     raise HTTPException(status_code=400, detail="Could not extract frames from video")
                
                # Batch process
                batch_size = 4
                all_embeds_list = []
                for i in range(0, len(frames), batch_size):
                    batch = frames[i:i+batch_size]
                    batch_emb = VLMService.get_batch_image_embeddings(batch, sigma=sigma)
                    all_embeds_list.append(batch_emb)
                
                if all_embeds_list:
                    embeds = torch.cat(all_embeds_list, dim=0)
                else:
                    embeds = torch.empty(0, 512).to(state.device) # Fallback

            elif source_type == "Random":
                embeds = VLMService.get_random_embedding(sigma=sigma)
            
            else:
                raise HTTPException(status_code=400, detail=f"Unknown source type: {source_type}")
                
            return embeds, timestamps, is_video

        # 1. Get Embeddings for A and B
        embeds_a, timestamps_a, is_video_a = await get_embeddings(source_a_type, source_a_text, source_a_file, reparam_sigma_a, text_embed_type_a)
        embeds_b, timestamps_b, is_video_b = await get_embeddings(source_b_type, source_b_text, source_b_file, reparam_sigma_b, text_embed_type_b)
        
        # 2. Compute Similarity based on types
        res_type = "scalar"
        score = None
        curve = None
        matrix = None
        best_frame = None
        avg_score = None
        
        # Case 1: Video vs Video -> Matrix
        if is_video_a and is_video_b:
            res_type = "matrix"
            sim_mat = VLMService.compute_similarity_matrix(embeds_a, embeds_b) # [Na, Nb]
            matrix = SimilarityMatrix(
                matrix=sim_mat.tolist(),
                rows_time=timestamps_a,
                cols_time=timestamps_b
            )
            avg_score = float(sim_mat.mean())
            
        # Case 2: Video vs Static (or Static vs Video) -> Curve
        # We need to map to "Curve" logic. 
        # Requirement: "Video vs Image/Text -> Similarity Curve".
        # If A is video, curve is over A. If B is video, curve is over B?
        # Spec says: "Video vs Text: Calculate similarity of each frame in Video A vs Text."
        # What if "Image vs Video"? Usually "Video vs Image".
        # Let's support A=Video vs B=Static.
        # If A=Static and B=Video, we can transpose or just treat as curve over B.
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

        elif not is_video_a and is_video_b:
            # Curve over B
            res_type = "curve"
            # [1, D] @ [Nb, D].T -> [1, Nb]
            sims = (embeds_a @ embeds_b.T).squeeze(0).cpu().numpy()
            
            curve_results = []
            for i, s in enumerate(sims):
                curve_results.append(FrameResult(time=timestamps_b[i], score=max(-1.0, min(1.0, float(s)))))
            
            curve = curve_results
            best_frame = max(curve, key=lambda x: x.score) if curve else None
            avg_score = sum(r.score for r in curve) / len(curve) if curve else 0.0
            
        # Case 3: Static vs Static -> Scalar
        else:
            res_type = "scalar"
            s, _ = VLMService.compute_similarity(embeds_a, embeds_b)
            score = s
            
        end_time = time.time()
        duration_ms = (end_time - start_time) * 1000
        
        return GenericAnalysisResponse(
            type=res_type,
            score=score,
            curve=curve,
            matrix=matrix,
            best_frame=best_frame,
            average_score=avg_score,
            time_taken_ms=duration_ms
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in temp_files:
            if os.path.exists(p):
                try:
                    os.unlink(p)
                except:
                    pass
