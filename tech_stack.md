# Tech Stack Documentation

## 1. Overview
The **VLM Similarity Scorer** is a hybrid web application featuring a Python-based backend for high-performance Machine Learning tasks and a modern, responsive web frontend for user interaction.

## 2. Backend
*   **Language**: Python 3.10+
*   **Web Framework**: **FastAPI**
    *   Chosen for its high performance (Starlette), native async support, and automatic data validation (Pydantic).
*   **Server**: **Uvicorn** (ASGI implementation).
*   **Machine Learning**:
    *   **PyTorch**: Core tensor computation and deep learning framework.
    *   **Hugging Face Transformers**: Used for loading pre-trained Vision-Language Models (VLMs) like CLIP and SigLIP.
    *   **Pillow (PIL)**: Image processing and manipulation.
*   **Utilities**:
    *   `python-multipart`: For handling form data and file uploads.
    *   `scikit-learn` & `sentencepiece`: Dependencies for model tokenizers.

## 3. Frontend
*   **Structure**: HTML5 (Rendered via Jinja2 templates served by FastAPI).
*   **Styling**: **TailwindCSS** (via CDN).
    *   Utility-first CSS framework for rapid UI development and responsiveness.
*   **Scripting**: Vanilla JavaScript (ES6+).
    *   Handles DOM manipulation, state management, and async API calls (`fetch`).
*   **Icons**: **Lucide Icons** (via CDN).
    *   Modern, lightweight icon set.
*   **Animations**: CSS Keyframes (Tailwind `animate-in`, `fade-in` utilities).

## 4. Architecture
### 4.1 Client-Server Communication
*   **Protocol**: HTTP/1.1 (REST).
*   **Data Format**: JSON for control messages; Multipart/Form-data for file uploads.
*   **Endpoints**:
    *   `GET /`: Serves the Single Page Application (SPA).
    *   `POST /api/load_model`: Triggers model loading on the server.
    *   `POST /api/predict`: Sends image/text data and receives similarity metrics.

### 4.2 Deployment (Local)
*   **Environment**: Runs directly on the host machine (Windows/Linux/macOS).
*   **Dependency Management**: `pip` via `requirements.txt`.

## 5. Key Libraries & Versions
*(Based on requirements.txt)*
*   `fastapi`
*   `uvicorn`
*   `python-multipart`
*   `transformers`
*   `pillow`
*   `torch` (Implicit dependency)
