# Product Requirement Document (PRD): VLM Similarity Scorer

## 1. Introduction
The **VLM Similarity Scorer** is a local web application designed to measure the semantic similarity between an image and a text prompt. Utilizing state-of-the-art Vision-Language Models (VLMs) like CLIP and SigLIP, it provides researchers and developers with a tool to analyze model alignment, embeddings, and inference performance in real-time.

## 2. User Flow
1.  **Launch**: User starts the application locally.
2.  **Configuration**:
    *   User selects a VLM model (Preset or Custom).
    *   User toggles GPU acceleration if available.
    *   User loads the model.
3.  **Input**:
    *   User uploads an image or selects "Random Vector".
    *   User enters a text prompt or selects "Random Vector".
4.  **Action**: User clicks "Calculate Similarity".
5.  **Output**: Application displays:
    *   Cosine Similarity Score.
    *   Vector Angle (degrees).
    *   Inference Time (latency).

## 3. Functional Requirements

### 3.1 Model Management
*   **Model Selection**:
    *   **Preset Models**:
        *   `google/siglip-so400m-patch14-384`
        *   `openai/clip-vit-base-patch32`
    *   **Custom Models**: Support any Hugging Face model ID compatible with `AutoModel` and `AutoProcessor`.
*   **Device Management**:
    *   Toggle between **CPU** and **GPU** (CUDA).
    *   Automatic detection of CUDA availability.
*   **Status Indicators**:
    *   Visual feedback for model loading states (Loading, Ready, Error).

### 3.2 Input Processing
*   **Image Source**:
    *   **Upload**: Drag-and-drop or file dialog for `png`, `jpg`, `jpeg`.
    *   **Random**: Generates a random normalized tensor matching the model's projection dimension.
*   **Text Source**:
    *   **Input**: Text area for natural language prompts.
    *   **Random**: Generates a random normalized tensor matching the model's projection dimension.

### 3.3 Analysis Core
*   **Embedding Extraction**: Use `AutoProcessor` and `AutoModel` to extract normalized features.
*   **Similarity Computation**: Calculate Cosine Similarity (`dot(text, image)`).
*   **Metrics**:
    *   **Score**: Clamped [-1, 1], displayed to 4 decimal places.
    *   **Angle**: `degrees(acos(score))`, displayed to 2 decimal places.
    *   **Latency**: End-to-end inference time in milliseconds.

### 3.4 User Interface
*   **Layout**:
    *   **Sidebar**: Contains configuration tabs (Source, General).
    *   **Workspace**: Displays analysis results (Score, Angle, Metadata).
*   **Responsiveness**: Uses TailwindCSS for a responsive grid layout.
*   **Feedback**:
    *   Loading spinners for long-running operations.
    *   Toast/Alert messages for errors (e.g., model load failure).

## 4. Non-Functional Requirements
*   **Privacy**: Local execution ensures data privacy.
*   **Performance**: Optimized for fast inference using PyTorch; UI interactions are non-blocking.
*   **Maintainability**: Separation of concerns (Frontend: simple HTML/JS, Backend: FastAPI).
