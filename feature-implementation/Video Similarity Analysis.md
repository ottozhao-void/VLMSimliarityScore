# Feature Implementation: Video Similarity Analysis

## Goal
Enable users to upload video files and analyze semantic similarity between the video content (frames) and a text prompt over time.

## User Requirements
1.  **Upload**: Support video file upload (mp4, webm, etc.).
2.  **Analysis**: Calculate similarity score for multiple frames across the video duration.
3.  **Visualization**: Display how the similarity score evolves throughout the video.
4.  **Interaction**: ideally link the score back to the video timestamp.

## Technical Design

### 1. Backend (`main.py`)

**Dependencies:**
- Add `opencv-python` for frame extraction.

**API Changes:**
- Modify `/api/predict`:
    - Accept `image_source="Video"`.
    - Accept `video` file upload.
    - When video is provided:
        1.  Save temp file or read into memory (if small).
        2.  Use `cv2.VideoCapture` to read frames.
        3.  Sampling Strategy: Extract 1 frame per second (FPS=1) to keep inference fast, or configurable interval.
        4.  Compute embeddings for all extracted frames.
        5.  Compute cosine similarity between Text Embedding and *each* Frame Embedding.
        6.  Return JSON:
            ```json
            {
              "type": "video",
              "frames": [
                {"time": 0.0, "score": 0.12},
                {"time": 1.0, "score": 0.45},
                ...
              ],
              "average_score": 0.3,
              "best_frame": {"time": 15.0, "score": 0.8},
              "time": 1234 // inference ms
            }
            ```

**Performance Considerations:**
- **Batching**: If using GPU, batch frames for inference (e.g., batch size 4 or 8) to speed up CLIP encoding.
- **Memory**: Don't load entire video to RAM if large. Process in chunks.
- **Cleanup**: Delete temp video files after processing.

### 2. Frontend (`index.html`)

**UI Updates:**
- **Source Selector**: Enable "Video" option.
- **Drop Zone**: Allow video file types. Show `<video>` preview instead of `<img>` when video is selected.
- **Calculate Button**: Handle video file payload.

**Results View:**
- **Graph**: Use a lightweight charting library (e.g., Chart.js via CDN) or a custom HTML/CSS bar graph to show the "Similarity Curve".
- **Interaction**:
    - Show "Best Match" frame timestamp.
    - (Nice to have) Clicking the graph seeks the video player to that timestamp.

## Implementation Steps

1.  **Setup**: Install `opencv-python`.
2.  **Backend Logic**: Create `VideoProcessor` helper class in `main.py`.
3.  **Endpoint**: Update `predict` to branch logic based on `image_source`.
4.  **Frontend**: Update JS to switch inputs and handle response data.
5.  **Visualization**: Add Chart visualization for the `frames` data.
