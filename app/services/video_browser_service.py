"""
Video Browser Service

Provides directory listing and fuzzy search for server-side video files.
Caches file list in memory to avoid repeated directory scans.
"""

from pathlib import Path
from typing import List, Optional
import os
from dataclasses import dataclass
from fuzzywuzzy import fuzz

# Configuration
VIDEO_DIRECTORY = Path("local_test_videos").resolve()
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v"}


@dataclass
class VideoFileInfo:
    """Information about a video file."""
    name: str
    size: int
    path: str


class VideoBrowserService:
    """
    Service for browsing and searching server-side video files.
    
    Maintains an in-memory cache of the video directory contents.
    """
    
    _cache: Optional[List[VideoFileInfo]] = None
    _cache_initialized: bool = False
    
    @classmethod
    def _refresh_cache(cls) -> None:
        """Scan video directory and refresh the cache."""
        cls._cache = []
        
        if not VIDEO_DIRECTORY.exists():
            # Directory doesn't exist - leave cache empty
            cls._cache_initialized = True
            return
        
        for entry in os.scandir(VIDEO_DIRECTORY):
            if entry.is_file():
                ext = Path(entry.name).suffix.lower()
                if ext in VIDEO_EXTENSIONS:
                    cls._cache.append(VideoFileInfo(
                        name=entry.name,
                        size=entry.stat().st_size,
                        path=entry.name  # Just filename, not full path for security
                    ))
        
        # Sort by name for consistent ordering
        cls._cache.sort(key=lambda v: v.name.lower())
        cls._cache_initialized = True
    
    @classmethod
    def _ensure_cache(cls) -> List[VideoFileInfo]:
        """Ensure cache is initialized and return it."""
        if not cls._cache_initialized:
            cls._refresh_cache()
        return cls._cache or []
    
    @classmethod
    def list_videos(
        cls,
        query: str = "",
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[VideoFileInfo], int, bool]:
        """
        List video files with optional fuzzy search.
        
        Args:
            query: Search string for fuzzy matching (empty = all files)
            limit: Maximum number of results to return
            offset: Number of results to skip (for pagination)
            
        Returns:
            Tuple of (videos, total_count, has_more)
        """
        all_videos = cls._ensure_cache()
        
        if query:
            # Apply fuzzy matching and sort by score
            scored = []
            query_lower = query.lower()
            for video in all_videos:
                # Use partial ratio for substring-like matching
                score = fuzz.partial_ratio(query_lower, video.name.lower())
                if score >= 50:  # Minimum threshold
                    scored.append((score, video))
            
            # Sort by score descending, then by name
            scored.sort(key=lambda x: (-x[0], x[1].name.lower()))
            filtered = [v for _, v in scored]
        else:
            filtered = all_videos
        
        total = len(filtered)
        paginated = filtered[offset:offset + limit]
        has_more = (offset + limit) < total
        
        return paginated, total, has_more
    
    @classmethod
    def get_video_path(cls, filename: str) -> Optional[Path]:
        """
        Get the full path to a video file.
        
        Validates that the file exists and is within the allowed directory.
        Returns None if the file is not valid.
        """
        # Prevent path traversal attacks
        if ".." in filename or "/" in filename or "\\" in filename:
            return None
        
        full_path = VIDEO_DIRECTORY / filename
        
        # Verify the path is within the allowed directory
        try:
            full_path = full_path.resolve()
            if not str(full_path).startswith(str(VIDEO_DIRECTORY.resolve())):
                return None
        except (OSError, ValueError):
            return None
        
        # Check file exists
        if not full_path.is_file():
            return None
        
        return full_path
    
    @classmethod
    def refresh(cls) -> int:
        """
        Manually refresh the cache.
        
        Returns the number of videos found.
        """
        cls._cache_initialized = False
        cls._refresh_cache()
        return len(cls._cache or [])
