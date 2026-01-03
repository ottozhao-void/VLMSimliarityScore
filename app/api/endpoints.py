from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models.schemas import LoadModelRequest, GenericAnalysisResponse
from app.services.vlm_engine import VLMService
from app.services.exceptions import SourceValidationError, VideoProcessingError, UnknownSourceTypeError
from app.core.state import state
import time
import os

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
    text_embed_type_a: str = Form("projected"),
    text_embed_type_b: str = Form("projected"),
    video_fps: int = Form(1)
):
    """
    Predict similarity between two sources.
    
    This endpoint handles HTTP concerns only. All business logic
    is delegated to VLMService.
    """
    if not state.has_model():
        raise HTTPException(status_code=400, detail="Model not loaded")

    start_time = time.time()
    temp_files = []
    
    try:
        # Process Source A
        embeds_a, timestamps_a, is_video_a, temp_a = await VLMService.process_source(
            source_type=source_a_type,
            text=source_a_text,
            file=source_a_file,
            sigma=reparam_sigma_a,
            text_embed_type=text_embed_type_a,
            video_fps=video_fps
        )
        temp_files.extend(temp_a)
        
        # Process Source B
        embeds_b, timestamps_b, is_video_b, temp_b = await VLMService.process_source(
            source_type=source_b_type,
            text=source_b_text,
            file=source_b_file,
            sigma=reparam_sigma_b,
            text_embed_type=text_embed_type_b,
            video_fps=video_fps
        )
        temp_files.extend(temp_b)
        
        # Compute similarity
        res_type, score, curve, matrix, best_frame, avg_score = VLMService.compute_generic_similarity(
            embeds_a, embeds_b, timestamps_a, timestamps_b, is_video_a, is_video_b
        )
        
        duration_ms = (time.time() - start_time) * 1000
        
        return GenericAnalysisResponse(
            type=res_type,
            score=score,
            curve=curve,
            matrix=matrix,
            best_frame=best_frame,
            average_score=avg_score,
            time_taken_ms=duration_ms
        )

    except SourceValidationError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except (VideoProcessingError, UnknownSourceTypeError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
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

