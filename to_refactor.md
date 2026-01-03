# Refactoring Report

Generated: 2026-01-04T01:45:10+08:00

## Summary
- Total files analyzed: 8
- Files with violations: 2

## Violations by Category

### Backend API Layer Violations

✅ **No violations found.**

The `app/api/endpoints.py` file correctly delegates all business logic to `VLMService`. It only handles:
- HTTP request parsing (Form, File, UploadFile)
- Input validation via Pydantic schemas
- Response formatting
- Exception handling and HTTP error codes

---

### Backend Service Layer Violations

⚠️ **`app/services/vlm_engine.py`**: Contains HTTP-specific imports and exceptions.

**Details:**
- **Line 11**: Imports `HTTPException` from FastAPI: `from fastapi import UploadFile, HTTPException`
- **Lines 188, 194, 201, 212, 235**: Raises `HTTPException` directly within service methods (`process_source`).

This couples the service layer to the HTTP framework. The service layer should be framework-agnostic and raise custom domain exceptions (e.g., `ValidationError`, `ProcessingError`) instead.

---

### Frontend View Layer Violations

⚠️ **`src/components/MainContent.tsx`**: Contains significant business logic and direct charting logic.

**Details:**
- **Lines 26-31**: Complex `isReady` calculation logic derived from state. This validation logic should ideally be in a custom hook or utility.
- **Lines 34-87, 125-195**: Chart.js configuration and rendering logic embedded directly in the component. Consider extracting chart config/logic into a dedicated hook (e.g., `useHeatmapChart`, `useSimilarityChart`) or utility functions.
- **Lines 90-122**: Heatmap interaction logic (`handleHeatmapMove`, `handleHeatmapClick`) embedded in component.

While having `useEffect` with Chart.js reference is a common React pattern, the substantial business logic for chart configuration and data transformation could be abstracted for better testability and reusability.

---

### Frontend Logic Layer Violations

✅ **No violations found.**

- `src/hooks/useAppState.ts`: Properly encapsulates state management.
- `src/hooks/useModel.ts`: Properly encapsulates model loading API logic.
- `src/hooks/usePrediction.ts`: Properly encapsulates prediction API logic.

All hooks focus on state/logic and do not leak UI concerns.

---

## Recommendations

### 1. Decouple `vlm_engine.py` from FastAPI

**Priority: High**

Refactor `VLMService.process_source()` to raise custom domain exceptions instead of `HTTPException`:

```python
# app/services/exceptions.py (NEW)
class SourceValidationError(Exception):
    """Raised when source validation fails."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class VideoProcessingError(Exception):
    """Raised when video frame extraction fails."""
    pass
```

Then in `endpoints.py`, catch these custom exceptions and convert them to `HTTPException`:

```python
from app.services.exceptions import SourceValidationError, VideoProcessingError

try:
    embeds_a, timestamps_a, is_video_a, temp_a = await VLMService.process_source(...)
except SourceValidationError as e:
    raise HTTPException(status_code=e.status_code, detail=e.message)
except VideoProcessingError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

---

### 2. Extract Chart Logic from `MainContent.tsx`

**Priority: Medium**

Create dedicated chart configuration utilities or hooks:

```typescript
// src/utils/chartConfig.ts (NEW)
export function createSimilarityCurveConfig(labels: string[], scores: number[], labelTitle: string): ChartConfiguration {
    return {
        type: 'line',
        data: { /* ... */ },
        options: { /* ... */ }
    };
}

// src/hooks/useSimilarityChart.ts (NEW)
export function useSimilarityChart(results: any, selectedRow: number | null) {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);
    
    useEffect(() => {
        // Chart creation/update logic
    }, [results, selectedRow]);
    
    return chartRef;
}
```

This would make `MainContent.tsx` more focused on layout/presentation.

---

### 3. Extract `isReady` Logic

**Priority: Low**

Move the `isReady` computation to a utility or the `useAppState` hook:

```typescript
// In useAppState.ts or a new utility
export function isSourceReady(state: AppState): boolean {
    const { sourceAType, sourceBType, sourceAText, sourceBText, sourceAFile, sourceBFile } = state;
    return (
        (sourceAType !== 'Text' || sourceAText.length > 0) &&
        (sourceBType !== 'Text' || sourceBText.length > 0) &&
        (sourceAType !== 'Image' && sourceAType !== 'Video' || sourceAFile) &&
        (sourceBType !== 'Image' && sourceBType !== 'Video' || sourceBFile)
    );
}
```

---

## Files Without Issues

The following files fully comply with modularity rules:

- ✅ `app/api/endpoints.py` - Clean controller pattern
- ✅ `app/services/video_processing.py` - Framework-agnostic video processing
- ✅ `src/components/Sidebar.tsx` - Presentational component with callbacks
- ✅ `src/hooks/useAppState.ts` - State management only
- ✅ `src/hooks/useModel.ts` - API logic only
- ✅ `src/hooks/usePrediction.ts` - API logic only
