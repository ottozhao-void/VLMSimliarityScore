# Feature Specification: Advanced Similarity Analysis & Generalization

## 1. Overview
This document outlines the requirements for generalizing the VLM Similarity Scorer to support arbitrary comparisons between two data sources ("Source A" and "Source B"), expanding beyond the current "Image vs. Text" model. It also introduces advanced analysis features like Video-to-Video similarity and embedding reparameterization.

## 2. UI/UX Changes

### 2.1. Source Renaming & Generalization
The current "Image Source" and "Text Source" inputs will be renamed and generalized:
*   **Source A** (previously Image Source)
*   **Source B** (previously Text Source)

Both Source A and Source B must support the complete list of input types:
1.  **Video** (New)
2.  **Image**
3.  **Text**
4.  **Random** (Generates random embeddings for testing)

### 2.2. Valid Comparison Pairs & Visualizations
The system must handle the following combinations:

| Source A | Source B | Visualization / Output | Logic |
| :--- | :--- | :--- | :--- |
| **Video** | **Video** | **2D Heatmap** & **Interactive Similarity Curve** | Calculate $N \times M$ similarity matrix (Frames A vs Frames B). |
| **Video** | **Image** | **Similarity Curve** | Calculate similarity of *each* frame in Video A vs the single Image B. |
| **Video** | **Text** | **Similarity Curve** | (Existing) Calculate similarity of *each* frame in Video A vs the Text embedding. |
| **Image** | **Image** | **Scalar Score** | Cosine similarity between two images. |
| **Image** | **Text** | **Scalar Score** | (Existing) Cosine similarity between Image and Text. |
| **Text** | **Text** | **Scalar Score** | Cosine similarity between two text prompts. |

*(Note: "Random" behaves like a static vector of the appropriate dimension, effectively acting like a single Image/Text embedding)*

### 2.3. Video vs. Video Interaction Details
When comparing two videos:
1.  **2D Heatmap**: An $N \times M$ grid color-coded by similarity score, where axes represent the timeline of Video A and Video B.
2.  **Similarity Curve Interaction**:
    *   **Clicking a frame in Video A**: Displays a 1D line chart showing the similarity of keyframe $A_i$ against **all** frames in Video B ($B_0 \dots B_m$).
    *   **Clicking a frame in Video A AND a frame in Video B**: Highlights the specific intersection point on the heatmap and displays the scalar cosine similarity score.

### 2.4. Text Source Configuration
When "Text" is selected as a source, a sub-menu must appear to configure the embedding extraction method:
*   **`text_embeds`** (Default): The standard projected embedding used for CLIP alignment.
*   **`pooler_output`**: The raw output from the text encoder's pooler layer (before the final projection to the joint multimodal space).

### 2.5. Global Settings: Reparameterization Trick
Add a global setting (checkbox) for **Reparameterization Trick** (Default: Disabled).
*   **Behavior**: When enabled, treat the extracted embedding $v$ as a mean vector $\mu$.
*   **Configuration**: Show a generic input field for **Sigma ($\sigma$)**.
*   **Computation**: Instead of using $v$ directly, sample $z = v + \sigma \cdot \epsilon$, where $\epsilon \sim \mathcal{N}(0, I)$, and use $z$ for similarity calculations.

## 3. Technical Implementation Details

### 3.1. Backend (`main.py` / `endpoints.py`)
*   **Endpoint Update**: The `/api/predict` endpoint needs to allow arbitrary combinations.
    *   *Current*: `image_source`, `text_source`
    *   *New*: `source_a_type`, `source_a_data`, `source_b_type`, `source_b_data` (or similar schema).
*   **Frame Extraction**:
    *   Ensure consistent sampling rates (e.g., 1 FPS) for both videos to keep the Heatmap dimensions manageable.
*   **Matrix Calculation**:
    *   For Video ($N$ frames) vs Video ($M$ frames), compute simple matrix multiplication of normalized embeddings: $[N, D] \times [M, D]^T \rightarrow [N, M]$.

### 3.2. Frontend (`src/App.tsx` etc.)
*   **State Management**: Refactor state to hold generic "Source A" and "Source B" configurations rather than distinct "Image" vs "Text" states.
*   **Charts**:
    *   Implement Heatmap visualization (likely using a canvas library or extended Chart.js/Recharts configuration).
    *   Update Line Chart to handle dynamic data sources (e.g., clicking a heatmap row updates the line chart).
