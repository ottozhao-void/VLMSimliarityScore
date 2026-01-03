"""
Custom domain exceptions for VLM service layer.

These exceptions decouple the service layer from HTTP concerns,
allowing the service to remain framework-agnostic.
"""


class SourceValidationError(Exception):
    """Raised when source validation fails (missing text/file for source type)."""
    
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class VideoProcessingError(Exception):
    """Raised when video frame extraction fails."""
    pass


class UnknownSourceTypeError(Exception):
    """Raised when an unknown source type is provided."""
    pass
