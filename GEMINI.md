# GEMINI.md

## User/Project Details
**VLM Similarity Scorer** is a local web application designed to measure the semantic similarity between visual inputs (images, videos) and text prompts using state-of-the-art Vision-Language Models (VLMs) like CLIP. It enables real-time analysis of model alignment, embeddings, and inference performance.

## Tech Stack
*   **Backend**:
    *   Python 3.10+
    *   FastAPI, Uvicorn (Server)
    *   PyTorch, Hugging Face Transformers (AI/ML)
    *   Pillow, OpenCV (Image/Video Processing)
*   **Frontend**:
    *   React 19, TypeScript
    *   Vite (Build Tool)
    *   Chart.js (Visualization)
    *   Lucide React (Icons)
    *   Sonner (Notifications)

## Project Structure
```
.
├── app/
│   ├── api/          # Endpoints (Controllers)
│   ├── core/         # State management & Config
│   ├── models/       # Pydantic Response/Request Schemas
│   └── services/     # Business Logic (VLM, Video Processing)
├── src/
│   ├── components/   # React Components (Presentational)
│   ├── hooks/        # Custom React Hooks (Logic)
│   └── utils/        # Utility functions
├── templates/        # Server-side HTML templates
├── main.py           # FastAPI Entry Point
├── package.json      # Frontend Dependencies & Scripts
├── requirements.txt  # Backend Dependencies
└── vite.config.ts    # Frontend Build Configuration
```

## Development Workflow

### Installation
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### Running Dev Server
```bash
# Terminal 1: Frontend (Dev Mode)
npm run dev

# Terminal 2: Backend (Hot Reload)
uvicorn main:app --reload
```

### Building for Production
```bash
npm run build
```

### Running Tests
*(Not explicitly configured in package.json, assume standard runners)*
```bash
pytest
```

## Coding Standards

### Naming Conventions
*   **Classes/Components**: PascalCase (e.g., `VLMService`, `SimilarityChart`).
*   **Variables/Functions**:
    *   Python: `snake_case`
    *   TypeScript: `camelCase`
*   **Files**:
    *   Python: `snake_case.py`
    *   React: `PascalCase.tsx`
    *   TS logic: `camelCase.ts`

### Component Structure
*   **Strict Separation**: Keep View (`.tsx`) and Logic (`.ts` hooks) separate.
*   **Atomic Design**: Small, reusable components located in `src/components`.

### Styling Preferences
*   **CSS**: Vanilla CSS or standard imports.
*   **Theme**: Consistent use of semantic class names matching the design system.

### Error Handling
*   **Backend**: Use custom exceptions in Services; catch and map to `HTTPException` in Controllers (API layer).
*   **Frontend**: Handle API errors gracefully with user-facing notifications (Sonner) and safe fallbacks.
