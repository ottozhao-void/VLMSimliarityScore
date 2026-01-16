from pydantic import BaseModel
from typing import Optional, List, Any

from pydantic import BaseModel, Field
from typing import Optional, List, Union, Any

class LoadModelRequest(BaseModel):
    model_id: str
    use_gpu: bool

class FrameResult(BaseModel):
    time: float
    score: float

class SimilarityMatrix(BaseModel):
    matrix: List[List[float]]
    rows_time: List[float] # Timepoints for Source A (y-axis usually)
    cols_time: List[float] # Timepoints for Source B (x-axis)

class GenericAnalysisResponse(BaseModel):
    type: str # "scalar", "curve", "matrix"
    score: Optional[float] = None
    curve: Optional[List[FrameResult]] = None
    matrix: Optional[SimilarityMatrix] = None
    best_frame: Optional[FrameResult] = None # For curve mode
    average_score: Optional[float] = None # For curve/matrix mode
    
    # Embedding vectors for display
    embeddings_a: Optional[List[List[float]]] = None  # Source A embeddings [N, D]
    embeddings_b: Optional[List[List[float]]] = None  # Source B embeddings [M, D]
    embed_dim: Optional[int] = None  # Embedding dimension (e.g., 512 for CLIP)
    
    time_taken_ms: float

class ErrorResponse(BaseModel):
    detail: str


class VideoFileInfo(BaseModel):
    """Information about a video file on the server."""
    name: str
    size: int
    path: str


class VideoListResponse(BaseModel):
    """Response for video list endpoint."""
    videos: List[VideoFileInfo]
    total: int
    hasMore: bool


# QVHighlights Dataset Models

class QVHighlightsQueryInfo(BaseModel):
    """Information about a single QVHighlights query."""
    qid: int
    query: str
    vid: str
    duration: float
    relevant_windows: List[List[float]]


class QVHighlightsQueryListResponse(BaseModel):
    """Response for QVHighlights query list endpoint."""
    queries: List[QVHighlightsQueryInfo]
    total: int
    hasMore: bool


class PathSettingsRequest(BaseModel):
    """Request for updating path settings."""
    datasetPath: str
    videoPath: str


class PathSettingsResponse(BaseModel):
    """Response for path settings operations."""
    valid: bool
    errors: List[str] = []
    datasetPath: Optional[str] = None
    videoPath: Optional[str] = None
