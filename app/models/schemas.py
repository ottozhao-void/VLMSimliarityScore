from pydantic import BaseModel
from typing import Optional, List, Any

class LoadModelRequest(BaseModel):
    model_id: str
    use_gpu: bool

class FrameResult(BaseModel):
    time: float
    score: float

class VideoAnalysisResponse(BaseModel):
    type: str = "video"
    frames: List[FrameResult]
    average_score: float
    best_frame: Optional[FrameResult] = None
    time: float

class ImagePredictionResponse(BaseModel):
    score: float
    angle: float
    time: float

class ErrorResponse(BaseModel):
    detail: str
