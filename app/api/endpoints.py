from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from app.models.schemas import (
    LoadModelRequest, GenericAnalysisResponse, VideoListResponse, VideoFileInfo,
    QVHighlightsQueryInfo, QVHighlightsQueryListResponse,
    PathSettingsRequest, PathSettingsResponse
)
from app.services.vlm_engine import VLMService
from app.services.video_browser_service import VideoBrowserService
from app.services.qvhighlights_service import QVHighlightsService
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


# ============================================================
# QVHighlights Dataset Endpoints
# ============================================================

@router.get("/qvhighlights/queries", response_model=QVHighlightsQueryListResponse)
async def list_qvhighlights_queries(
    query: str = Query("", description="Fuzzy search query on query text"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Results offset")
):
    """
    List QVHighlights dataset queries with optional fuzzy search.
    """
    try:
        queries, total, has_more = QVHighlightsService.list_queries(query, limit, offset)
        return QVHighlightsQueryListResponse(
            queries=[
                QVHighlightsQueryInfo(
                    qid=q.qid,
                    query=q.query,
                    vid=q.vid,
                    duration=q.duration,
                    relevant_windows=q.relevant_windows
                ) for q in queries
            ],
            total=total,
            hasMore=has_more
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list queries: {str(e)}")


@router.get("/qvhighlights/stream/{vid}")
async def stream_qvhighlights_video(vid: str):
    """
    Stream a video file from the QVHighlights dataset by vid.
    """
    video_path = QVHighlightsService.get_video_path(vid)
    if not video_path:
        raise HTTPException(status_code=404, detail=f"Video not found for vid: {vid}")
    
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


@router.get("/settings/paths", response_model=PathSettingsResponse)
async def get_path_settings():
    """
    Get current dataset and video path settings.
    """
    dataset_path, video_path = QVHighlightsService.get_paths()
    return PathSettingsResponse(
        valid=True,
        datasetPath=dataset_path,
        videoPath=video_path
    )


@router.post("/settings/paths", response_model=PathSettingsResponse)
async def update_path_settings(request: PathSettingsRequest):
    """
    Validate and update dataset and video path settings.
    """
    is_valid, errors = QVHighlightsService.validate_paths(
        request.datasetPath,
        request.videoPath
    )
    
    if is_valid:
        QVHighlightsService.set_paths(request.datasetPath, request.videoPath)
    
    return PathSettingsResponse(
        valid=is_valid,
        errors=errors,
        datasetPath=request.datasetPath if is_valid else None,
        videoPath=request.videoPath if is_valid else None
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
    video_fps: int = Form(1),
    # DATASET:QVHighlights specific fields
    qv_query: Optional[str] = Form(None),
    qv_vid: Optional[str] = Form(None),
    qv_duration: Optional[float] = Form(None)
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
        # Check for DATASET:QVHighlights source type
        is_dataset_mode = source_a_type == "DATASET:QVHighlights" or source_b_type == "DATASET:QVHighlights"
        
        if is_dataset_mode:
            # DATASET mode: compute both text-to-video curve AND video self-similarity matrix
            if not qv_query or not qv_vid:
                raise HTTPException(status_code=400, detail="QVHighlights query and vid required for DATASET mode")
            
            # Get video embeddings
            video_embeds, video_timestamps, _, temp_v = await VLMService.process_source(
                source_type="Video",
                text=None,
                file=None,
                server_path=qv_vid,
                sigma=reparam_sigma_a,
                text_embed_type="projected",
                video_fps=video_fps
            )
            temp_files.extend(temp_v)
            
            # Get text embedding for the query
            text_embeds, _, _, _ = await VLMService.process_source(
                source_type="Text",
                text=qv_query,
                file=None,
                server_path=None,
                sigma=0.0,
                text_embed_type=text_embed_type_a,
                video_fps=1
            )
            
            # Compute text-to-video curve
            _, _, curve, _, best_frame, curve_avg = VLMService.compute_generic_similarity(
                video_embeds, text_embeds, video_timestamps, None, True, False
            )
            
            # Compute video self-similarity matrix
            _, _, _, matrix, _, matrix_avg = VLMService.compute_generic_similarity(
                video_embeds, video_embeds, video_timestamps, video_timestamps, True, True
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            return GenericAnalysisResponse(
                type="dataset",
                score=None,
                curve=curve,
                matrix=matrix,
                best_frame=best_frame,
                average_score=curve_avg,
                time_taken_ms=duration_ms
            )
        
        # Standard processing for non-dataset mode
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

