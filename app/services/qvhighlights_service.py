"""
QVHighlights Service

Parses JSONL annotation files from the QVHighlights dataset,
caches them in memory, and provides fuzzy search functionality.
"""

from pathlib import Path
from typing import List, Optional, Tuple
import json
import os
from dataclasses import dataclass, field
from fuzzywuzzy import fuzz


# Default paths - can be overridden via settings
_DEFAULT_DATASET_PATH = "/data1/zhaofanghan/vmr_dataset/data/qvhighlights"
_DEFAULT_VIDEO_PATH = "/data1/zhaofanghan/vmr_dataset/qvhilights_videos"


@dataclass
class QVHighlightsQuery:
    """A single query entry from the QVHighlights dataset."""
    qid: int
    query: str
    vid: str
    duration: float
    relevant_windows: List[List[float]] = field(default_factory=list)


class QVHighlightsService:
    """
    Service for browsing and searching QVHighlights dataset queries.
    
    Parses JSONL files from the configured dataset path and caches them
    in memory for efficient fuzzy search.
    """
    
    _cache: Optional[List[QVHighlightsQuery]] = None
    _cache_initialized: bool = False
    _dataset_path: str = _DEFAULT_DATASET_PATH
    _video_path: str = _DEFAULT_VIDEO_PATH
    
    @classmethod
    def get_paths(cls) -> Tuple[str, str]:
        """Get current dataset and video paths."""
        return cls._dataset_path, cls._video_path
    
    @classmethod
    def set_paths(cls, dataset_path: str, video_path: str) -> None:
        """Set dataset and video paths. Triggers cache refresh."""
        cls._dataset_path = dataset_path
        cls._video_path = video_path
        cls._cache_initialized = False
        cls._cache = None
    
    @classmethod
    def validate_paths(cls, dataset_path: str, video_path: str) -> Tuple[bool, List[str]]:
        """
        Validate that the given paths exist on the server.
        
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        dataset_dir = Path(dataset_path)
        if not dataset_dir.exists():
            errors.append(f"Dataset path does not exist: {dataset_path}")
        elif not dataset_dir.is_dir():
            errors.append(f"Dataset path is not a directory: {dataset_path}")
        else:
            # Check for JSONL files
            jsonl_files = list(dataset_dir.glob("*.jsonl"))
            if not jsonl_files:
                errors.append(f"No .jsonl files found in dataset path: {dataset_path}")
        
        video_dir = Path(video_path)
        if not video_dir.exists():
            errors.append(f"Video path does not exist: {video_path}")
        elif not video_dir.is_dir():
            errors.append(f"Video path is not a directory: {video_path}")
        
        return len(errors) == 0, errors
    
    @classmethod
    def _parse_jsonl_file(cls, file_path: Path) -> List[QVHighlightsQuery]:
        """Parse a single JSONL file and return list of queries."""
        queries = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        query = QVHighlightsQuery(
                            qid=data.get('qid', 0),
                            query=data.get('query', ''),
                            vid=data.get('vid', ''),
                            duration=data.get('duration', 0.0),
                            relevant_windows=data.get('relevant_windows', [])
                        )
                        queries.append(query)
                    except (json.JSONDecodeError, KeyError) as e:
                        # Skip malformed lines
                        print(f"Warning: Failed to parse line in {file_path}: {e}")
                        continue
        except IOError as e:
            print(f"Warning: Failed to read file {file_path}: {e}")
        
        return queries
    
    @classmethod
    def _refresh_cache(cls) -> None:
        """Scan dataset directory and refresh the cache."""
        cls._cache = []
        
        dataset_dir = Path(cls._dataset_path)
        if not dataset_dir.exists():
            cls._cache_initialized = True
            return
        
        # Parse all JSONL files in the directory
        for jsonl_file in dataset_dir.glob("*.jsonl"):
            queries = cls._parse_jsonl_file(jsonl_file)
            cls._cache.extend(queries)
        
        # Sort by qid for consistent ordering
        cls._cache.sort(key=lambda q: q.qid)
        cls._cache_initialized = True
        
        print(f"QVHighlights: Loaded {len(cls._cache)} queries from {cls._dataset_path}")
    
    @classmethod
    def _ensure_cache(cls) -> List[QVHighlightsQuery]:
        """Ensure cache is initialized and return it."""
        if not cls._cache_initialized:
            cls._refresh_cache()
        return cls._cache or []
    
    @classmethod
    def list_queries(
        cls,
        query: str = "",
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[QVHighlightsQuery], int, bool]:
        """
        List queries with optional fuzzy search.
        
        Args:
            query: Search string for fuzzy matching on query text (empty = all)
            limit: Maximum number of results to return
            offset: Number of results to skip (for pagination)
            
        Returns:
            Tuple of (queries, total_count, has_more)
        """
        all_queries = cls._ensure_cache()
        
        if query:
            # Apply fuzzy matching and sort by score
            scored = []
            query_lower = query.lower()
            for q in all_queries:
                # Use partial ratio for substring-like matching
                score = fuzz.partial_ratio(query_lower, q.query.lower())
                if score >= 40:  # Lower threshold for query text
                    scored.append((score, q))
            
            # Sort by score descending, then by qid
            scored.sort(key=lambda x: (-x[0], x[1].qid))
            filtered = [q for _, q in scored]
        else:
            filtered = all_queries
        
        total = len(filtered)
        paginated = filtered[offset:offset + limit]
        has_more = (offset + limit) < total
        
        return paginated, total, has_more
    
    @classmethod
    def get_video_path(cls, vid: str) -> Optional[Path]:
        """
        Get the full path to a video file by vid.
        
        Returns None if the video doesn't exist.
        """
        # The vid format is typically "videoId_start_end" 
        # The actual filename should be vid + .mp4
        video_filename = f"{vid}.mp4"
        video_path = Path(cls._video_path) / video_filename
        
        if video_path.is_file():
            return video_path
        
        # Try without extension assumption - check common formats
        for ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
            video_path = Path(cls._video_path) / f"{vid}{ext}"
            if video_path.is_file():
                return video_path
        
        return None
    
    @classmethod
    def refresh(cls) -> int:
        """
        Manually refresh the cache.
        
        Returns the number of queries found.
        """
        cls._cache_initialized = False
        cls._refresh_cache()
        return len(cls._cache or [])
