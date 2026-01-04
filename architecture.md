# Project Architecture

## Overview
**VLM Similarity Scorer** is a hybrid web application designed to compute and visualize semantic similarities between visual inputs (Images, Videos) and Text using Vision-Language Models (VLMs).

The system follows a clear separation of concerns:
*   **Backend (Python/FastAPI)**: Handles model loading, inference, video frame extraction, and API serving.
*   **Frontend (React/TypeScript)**: Manages user interaction, file uploads, state, and result visualization.

## Directory Structure

```
root/
├── app/                    # Backend Source Code
│   ├── api/                # API Route Definitions
│   ├── core/               # App State & Configuration
│   ├── models/             # Pydantic Schemas
│   └── services/           # Business Logic (VLM, Video)
├── feature-implementation/ # Feature Documentation
├── src/                    # Frontend Source Code
│   ├── components/         # Reusable UI Components
│   ├── hooks/              # Custom React Hooks (Logic)
│   ├── App.tsx             # Main Application Component
│   └── main.tsx            # Frontend Entry Point
├── static/                 # Static Assets (Compiled API output)
├── templates/              # Server-side Templates (Jinja2)
├── main.py                 # FastAPI Application Entry Point
└── requirements.txt        # Python Dependencies
```

## Backend Architecture

The backend is built with **FastAPI** and follows a **Controller-Service** pattern.

### 1. Entry Point (`main.py`)
*   Initializes the FastAPI application.
*   Mounts static files (for the React frontend).
*   Serves the main `index.html` template.
*   Includes API routers.

### 2. API Layer (`app/api/`)
*   **`endpoints.py`**: Defines HTTP endpoints for the frontend.
    *   POST `/api/load_model`: Loads the specified VLM into memory.
    *   POST `/api/predict`: Handles inference requests for Images and Videos.
*   **Responsibilities**: Request validation, parameter parsing, and response formatting using Pydantic schemas.

### 3. Service Layer (`app/services/`)
*   **`vlm_engine.py`**: Encapsulates the core VLM logic (e.g., CLIP). Handles model/processor initialization, embedding generation, and similarity calculation.
*   **`video_processing.py`**: Handles video file processing, frame extraction (using OpenCV), and temporal sampling.

### 4. State Management (`app/core/`)
*   **`state.py`**: Implements a Singleton pattern to hold the loaded Model and Processor instances in memory, ensuring they persist across requests.

## Frontend Architecture

The frontend is a **Single Page Application (SPA)** built with **React**, **TypeScript**, and **Vite**.

### 1. View Layer (`src/App.tsx`, `src/components/`)
*   **`App.tsx`**: The root component that composes the UI.
*   **`components/`**: Reusable UI elements (e.g., File Uploaders, Sidebar, Result Charts).
*   **Design**: Uses mostly custom CSS (`index.css`) with specific utility libraries.

### 2. Logic Layer (`src/hooks/`)
*   Custom hooks encompass complex business logic and state management, separating it from the UI rendering.
*   Handles API communication (`fetch`), form state, and loading states.

### 3. Main Entry (`src/main.tsx`)
*   Mounts the React application into the DOM.

## Data Flow

1.  **Frontend** sends a request (e.g., Upload Video + Text).
2.  **FastAPI** receives the request at `/api/predict`.
3.  **Controller** validates inputs using `LoadModelRequest` or Form data.
4.  **Service Layer**:
    *   If Video: `video_processing` extracts frames -> `vlm_engine` computes embeddings for frames & text -> computes similarity matrix.
    *   If Image: `vlm_engine` computes embeddings -> computes cosine similarity.
5.  **FastAPI** returns a JSON response defined by schemas (e.g., `VideoAnalysisResponse`).
6.  **Frontend** receives data and renders charts/scores.
