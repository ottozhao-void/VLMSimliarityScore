# Gemini Context: VLM Similarity Scorer

This document provides a comprehensive overview of the **VLM Similarity Scorer** project for Gemini agents.

## Project Overview

**VLM Similarity Scorer** is a local web application designed to measure the semantic similarity between an image and a text prompt using state-of-the-art Vision-Language Models (VLMs) like CLIP and SigLIP. It allows researchers and developers to analyze model alignment, embeddings, and inference performance in real-time.

The project appears to have two components:
1.  **Active Core (Root):** A Python-based full-stack application using **FastAPI** for the backend and **Jinja2 templates** with Vanilla JS/TailwindCSS for the frontend. This matches the descriptions in `PRD.md` and `tech_stack.md`.
2.  **Legacy Client (`legacy_client/`):** A React/Vite application. This seems to be an earlier iteration or an alternative client-side implementation (possibly using ONNX/Xenova) that is now secondary to the Python backend.

## Tech Stack (Active Core)

*   **Backend:** Python 3.10+, FastAPI, Uvicorn.
*   **AI/ML:** PyTorch, Hugging Face Transformers (`transformers`), Pillow (PIL).
*   **Frontend:** HTML5 (Jinja2), TailwindCSS (CDN), Lucide Icons (CDN), Vanilla JavaScript.
*   **Communication:** REST API (JSON & Multipart/Form-data).

## Architecture

### Backend (`main.py`)
*   **Server:** FastAPI application running on Uvicorn.
*   **Endpoints:**
    *   `GET /`: Serves the main UI (`templates/index.html`).
    *   `POST /api/load_model`: Loads a specified VLM (e.g., SigLIP, CLIP) into memory (GPU/CPU).
    *   `POST /api/predict`: Accepts image/text inputs, computes embeddings, and returns cosine similarity and angle.
*   **Model State:** A global `ModelState` class manages the loaded model and processor to avoid reloading for every request.

### Frontend (`templates/` & `static/`)
*   **UI:** Single-page interface defined in `templates/index.html`.
*   **Styling:** TailwindCSS is likely used via CDN (referenced in docs).
*   **Logic:** JavaScript handles user interactions (drag-and-drop, form submission) and calls the backend API.

## Directory Structure

*   **`main.py`**: The entry point for the FastAPI server.
*   **`requirements.txt`**: Python dependencies.
*   **`templates/`**: Contains HTML templates (Jinja2).
*   **`static/`**: Contains static assets (CSS, JS, images).
*   **`legacy_client/`**: Contains the legacy React/Vite frontend code.
*   **`PRD.md`**: Product Requirements Document.
*   **`tech_stack.md`**: Technical documentation.

## Setup & Usage

### active Core (Python/FastAPI)

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Run Application:**
    ```bash
    python main.py
    # OR
    uvicorn main:app --reload
    ```
    The server typically starts at `http://0.0.0.0:8000`.

### Legacy Client (React)

1.  **Navigate to Directory:**
    ```bash
    cd legacy_client
    ```

2.  **Install & Run:**
    ```bash
    npm install
    npm run dev
    ```

## Development Conventions

*   **Code Style:** Python code follows standard PEP 8 guidelines (inferred).
*   **Dependencies:** Managed via `requirements.txt` (Python) and `package.json` (Node.js).
*   **Model Handling:** Models are loaded lazily or via explicit user action to manage memory usage.
*   **Environment:** The app is designed to run locally, with optional GPU support.

## Code Stye Guidelines

* Modularity: Each feature should be implemented in a separate module, class or function to promote code reusability and maintainability.
* Documentation: Maintain clear documentation for each module or class, including usage instructions and examples.


## Key Files to Reference

*   **`main.py`**: Core logic for model loading, inference, and API routing.
*   **`PRD.md`**: Detailed functional and non-functional requirements.
*   **`tech_stack.md`**: Detailed architecture and library versions.
