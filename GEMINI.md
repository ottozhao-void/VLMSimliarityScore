# Gemini Context: VLM Similarity Scorer

This document provides a comprehensive overview of the **VLM Similarity Scorer** project for Gemini agents.

## Project Overview

**VLM Similarity Scorer** is a local web application designed to measure the semantic similarity between visual inputs (images, videos) and text prompts using state-of-the-art Vision-Language Models (VLMs) like CLIP and SigLIP. It enables real-time analysis of model alignment, embeddings, and inference performance.

## Tech Stack

*   **Backend:** Python 3.10+, FastAPI, Uvicorn.
*   **AI/ML:** PyTorch, Hugging Face Transformers, Pillow (PIL), OpenCV (for video).
*   **Frontend:** TypeScript, Vite, Chart.js, Lucide Icons.
*   **Architecture:** Hybrid. FastAPI serves the main HTML template and API endpoints. The frontend logic is built with Vite/TypeScript and served as static assets.

## Directory Structure

*   **`main.py`**: The entry point for the FastAPI server. Handles API routes, model loading, and inference logic.
*   **`templates/`**: Contains the server-side rendered HTML (`index.html`).
*   **`static/`**: Serves static assets. `static/dist` contains the compiled frontend code from Vite.
*   **`src/`**: Source code for the TypeScript frontend (`main.ts`).
*   **`feature-implementation/`**: Documentation for specific features (e.g., Video Similarity Analysis).
*   **`requirements.txt`**: Python dependencies.
*   **`package.json`**: Node.js dependencies and scripts.
*   **`vite.config.ts`**: Vite configuration, builds output to `static/dist`.

## Key Features

1.  **Model Loading (`/api/load_model`):**
    *   Dynamically loads VLMs (SigLIP, CLIP) from Hugging Face.
    *   Supports GPU acceleration (`cuda`) if available.
    *   Maps "Xenova" model IDs to their upstream Hugging Face equivalents (e.g., `Xenova/siglip...` -> `google/siglip...`).

2.  **Similarity Prediction (`/api/predict`):**
    *   **Image vs. Text:** Computes cosine similarity and angle between an image embedding and a text embedding.
    *   **Video vs. Text:** Extracts frames from uploaded video (default 1 FPS), computes similarity for each frame against the text, and returns a temporal analysis (best frame, average score, per-frame scores).
    *   **Random Vectors:** Supports generating random embeddings for testing pipeline mechanics without model inference.

## Setup & Usage

### Prerequisites
*   Python 3.10+
*   Node.js & npm

### Installation

1.  **Backend Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Frontend Dependencies:**
    ```bash
    npm install
    ```

### Building & Running

1.  **Build Frontend:**
    The frontend must be built so FastAPI can serve the assets from `static/dist`.
    ```bash
    npm run build
    ```

2.  **Run Server:**
    ```bash
    python main.py
    # OR
    uvicorn main:app --reload
    ```
    The application will be accessible at `http://localhost:8000`.

## Development Conventions

*   **Frontend Build:** The project uses Vite. Assets are compiled to `static/dist`. When making frontend changes, ensure you rebuild (`npm run build`) or use `npm run dev` with appropriate proxying if configured (though `main.py` expects static files).
*   **Model Management:** The `ModelState` class in `main.py` manages the global model instance to prevent reloading on every request.
*   **Video Processing:** Video analysis is handled by extracting frames using OpenCV, processing them in batches, and aggregating results.

## Code Style Guidelines

### Architecture Principles
- **Separation of Concerns**: Strictly enforce boundaries between the Interface Layer (API/UI) and the Domain/Business Logic Layer.
- **Modularity**: Design all system components with high cohesion and low coupling to maximize reusability and testability.

### Backend (Python)
- **Layered Architecture (Controller-Service Pattern)**:
    - **API Layer (Controllers)**: Responsible solely for HTTP request handling, input validation (Pydantic), authentication, and response formatting. **Do not** write business logic or model inference code here.
    - **Algorithm Layer (Services)**: Encapsulates the core VLM logic, tensor operations, and data preprocessing. This layer should be framework-agnostic regarding the HTTP server.
- **Model Management**:
    - Implement the **Singleton Pattern** for VLM initialization. The model should be loaded into memory once at application startup, not instantiated per request.
- **Typing**: Use strong typing with `Type Hints` and `Pydantic` models to enforce data contracts.

### Frontend (TypeScript/React)
- **Component Design (View vs. Logic)**:
    - **`.tsx` (View)**: Focus exclusively on UI rendering and layout. Keep components "dumb" or presentational where possible.
    - **`.ts` (Logic)**: Encapsulate complex state management, API integration, and business rules within **Custom Hooks** or utility functions.
- **Reusability**: Break down UIs into atomic, reusable components. Avoid hardcoding VLM-specific logic into generic UI elements (e.g., an `ImageUploader` component should not know about "similarity calculation" internals).
- **Type Safety**: Maintain strict TypeScript interfaces for all API responses. Ensure frontend interfaces match the backend Pydantic models.

## Key Files to Reference

*   **`main.py`**: Core backend logic.
*   **`src/main.ts`**: Frontend entry point.
*   **`vite.config.ts`**: Build configuration.
*   **`requirements.txt`**: Backend package list.
