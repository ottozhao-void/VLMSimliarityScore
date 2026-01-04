# Files to Refactor

> Generated on: 2026-01-04

## Summary
The inspection revealed **Complete Feature Encapsulation violations** in frontend chart components/hooks, continued coupling between the backend service layer and the HTTP transport layer, and a monolithic frontend component that violates separation of concerns.

## Violations by Category

### Frontend Violations

| File | Violation | Recommendation |
|------|-----------|----------------|
| `src/hooks/useHeatmapChart.ts` + `src/components/MainContent.tsx` | **Complete Feature Encapsulation Violation**: The `useHeatmapChart` hook returns only partial functionality (`hoverInfo`, `handleHeatmapMove`, `handleHeatmapLeave`). Related state (`selectedRow`, `showUpperTriangle`), the toggle UI control, and the `handleHeatmapClick` handler are scattered in `MainContent.tsx`. | Refactor into a self-contained `<HeatmapChart />` component that owns all internal state, UI controls (Upper Triangle toggle), click handlers, and hover info display. Parent should only pass `data` and optional callbacks like `onRowSelect`. |
| `src/hooks/useSimilarityChart.ts` + `src/components/MainContent.tsx` | **Partial Feature Encapsulation**: The hook manages Chart.js lifecycle but states like `selectedRow` (which determines what data to display) and the chart container/instruction UI are in the parent. | Refactor into a self-contained `<SimilarityChart />` component that encapsulates the canvas, chart instance, click handling, and all related UI (instructions, context badges). |
| `src/components/Sidebar.tsx` | **Monolithic Component**: File is ~700 lines and uses an internal helper function `renderSourceSection` to render complex UI. Has grown significantly since last inspection. | Extract `renderSourceSection` into a standalone `SourceSection.tsx` component. Consider further breakdown into `ModelSettings.tsx`, `GeneralSettings.tsx`. |
| `src/components/Sidebar.tsx` | **Prop Drilling / Tight Coupling**: Receives the entire `AppState` object plus many additional props, making it hard to test and reuse. Interface has ~20+ props. | Pass only specific props needed by sub-components, or use a context provider to avoid prop drilling if moving to smaller components. |
| `src/components/MainContent.tsx` | **Mixed UI Responsibilities**: Contains duplicated heatmap rendering logic (lines 162-215 AND 294-314) for `matrix` type and `dataset` type. The dataset tab view partially duplicates the matrix heatmap render block. | Extract heatmap into a reusable component that handles both cases via props, eliminating duplication. |

### Architecture Violations

| File | Violation | Recommendation |
|------|-----------|----------------|
| `app/services/vlm_engine.py` | Service layer depends on FastAPI's `UploadFile` type in `process_source` signature. | Decouple `process_source` from `UploadFile`. Accept `bytes`, `file_path`, or `BinaryIO` instead. Move file handling logic to the controller or an adapter. |

### Backend Violations

| File | Violation | Recommendation |
|------|-----------|----------------|
| `app/services/vlm_engine.py` | `process_source` handles temporary file creation for uploads, mixing transport resource management with domain logic. | Move temporary file creation/management to `endpoints.py` or a dedicated resource manager. Service should operate on valid paths/streams. |
| `app/api/endpoints.py` | Manual `try...finally` block for cleaning up temp files is fragile and verbose. | Encapsulate temp file lifecycle in a context manager or a dependency to ensure cleaner resource management. |

### General Coding Standard Violations

| File | Violation | Recommendation |
|------|-----------|----------------|
| `src/components/MainContent.tsx` | Uses `any` type for `results` prop, reducing type safety. | Define a proper TypeScript interface for the results object (e.g., `AnalysisResults`) that matches the backend `GenericAnalysisResponse` schema. |

## Priority Order

1. **[High - Critical UX Impact]** Refactor `useHeatmapChart` + heatmap rendering into a self-contained `<HeatmapChart />` component. This encapsulates `selectedRow`, `showUpperTriangle`, toggle button, hover info, and click handling for row selection. **This directly addresses the user's concern about missing features reported in conversation 75f63b43.**

2. **[High - Critical UX Impact]** Refactor `useSimilarityChart` into a self-contained `<SimilarityChart />` component that encapsulates the Chart.js canvas, click-to-seek functionality, and associated UI.

3. **[Medium]** Extract `SourceSection` from `Sidebar.tsx` to improve maintainability and readability. Consider also extracting `ModelSettingsPanel` and `GeneralSettingsPanel`.

4. **[Medium]** Refactor `app/services/vlm_engine.py` to remove FastAPI `UploadFile` dependency - ensures the core engine is portable and testable.

5. **[Low]** Add proper TypeScript types for `results` in `MainContent.tsx`.

6. **[Low]** Cleanup `app/api/endpoints.py` temp file handling with context managers.

## Next Steps

1. Create `<HeatmapChart />` component that fully encapsulates:
   - Canvas element and rendering
   - `selectedRow` and `showUpperTriangle` state
   - Toggle button UI
   - Hover info display
   - Click handler for row selection
   - Mouse event handlers
   - Props: `data: SimilarityMatrix`, `onRowSelect?: (rowIndex: number, timestamp: number) => void`

2. Create `<SimilarityChart />` component that fully encapsulates:
   - Canvas element and Chart.js instance lifecycle
   - Click-to-seek functionality
   - Instruction text
   - Source A context badge (when in matrix mode)
   - Props: `data: CurveData | MatrixRowData`, `onPointClick?: (timeSeconds: number) => void`, `sourceATime?: number`

3. Extract `SourceSection` component from `Sidebar.tsx`.

4. Refactor `VLMService` to accept generic input types instead of `UploadFile`.
