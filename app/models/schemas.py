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
    
    time_taken_ms: float

class ErrorResponse(BaseModel):
    detail: str

