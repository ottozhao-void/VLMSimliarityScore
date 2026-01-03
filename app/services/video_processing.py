import cv2
from PIL import Image
import numpy as np
from typing import List, Tuple

def extract_frames(video_path: str, fps: int = 1) -> Tuple[List[Image.Image], List[float]]:
    """
    Extracts frames from video at specified FPS.
    
    Args:
        video_path: Path to the video file.
        fps: Frames per second to extract.
        
    Returns:
        Tuple of (list of PIL Images, list of timestamps in seconds).
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return [], []
    
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    if not video_fps or video_fps <= 0:
        # Fallback if FPS is not detected
        video_fps = 30.0 
        
    # timestamp calculation logic needs to be robust
    
    frames = []
    timestamps = []
    
    # Calculate interval in frames
    # If fps is 1 and video_fps is 30, interval is 30 frames.
    interval = int(video_fps / fps)
    if interval < 1: interval = 1
    
    current_frame = 0
    
    # We can loop frame by frame or jump
    # Jumping is faster using CAP_PROP_POS_FRAMES
    
    while True:
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert BGR to RGB (OpenCV uses BGR)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frames.append(Image.fromarray(frame_rgb))
        timestamps.append(current_frame / video_fps)
        
        current_frame += interval
        
    cap.release()
    return frames, timestamps
