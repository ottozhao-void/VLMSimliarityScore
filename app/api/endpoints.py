from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from app.models.schemas import LoadModelRequest, GenericAnalysisResponse, VideoListResponse, VideoFileInfo
from app.services.vlm_engine import VLMService
from app.services.video_browser_service import VideoBrowserService
from app.services.exceptions import SourceValidationError, VideoProcessingError, UnknownSourceTypeError
from app.core.state import state
import time
import os
import mimetypes

router = APIRouter()

@router.post("/load_model")
async def load_model(request: LoadModelRequest):
    try:
        msg = VLMService.load_model(request.model_id, request.use_gpu)
        return {"status": "success", "message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/videos", response_model=VideoListResponse)
async def list_videos(
    query: str = Query("", description="Fuzzy search query"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Results offset")
):
    """
    List video files from the server directory with optional fuzzy search.
    """
    try:
        videos, total, has_more = VideoBrowserService.list_videos(query, limit, offset)
        return VideoListResponse(
            videos=[VideoFileInfo(name=v.name, size=v.size, path=v.path) for v in videos],
            total=total,
            hasMore=has_more
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list videos: {str(e)}")


@router.get("/videos/stream/{filename}")
async def stream_video(filename: str):
    """
    Stream a video file from the server directory.
    Supports HTTP Range requests for seeking.
    """
    video_path = VideoBrowserService.get_video_path(filename)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Determine MIME type
    mime_type, _ = mimetypes.guess_type(str(video_path))
    if not mime_type:
        mime_type = "video/mp4"
    
    file_size = video_path.stat().st_size
    
    def iter_file():
        with open(video_path, "rb") as f:
            while chunk := f.read(65536):  # 64KB chunks
                yield chunk
    
    return StreamingResponse(
        iter_file(),
        media_type=mime_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size)
        }
    )


@router.post("/predict", response_model=GenericAnalysisResponse)
async def predict(
    source_a_type: str = Form(...),
    source_b_type: str = Form(...),
    source_a_text: Optional[str] = Form(None),
    source_b_text: Optional[str] = Form(None),
    source_a_file: Optional[UploadFile] = File(None),
    source_b_file: Optional[UploadFile] = File(None),
    source_a_server_path: Optional[str] = Form(None),
    source_b_server_path: Optional[str] = Form(None),
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
            server_path=source_a_server_path,
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
            server_path=source_b_server_path,
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

