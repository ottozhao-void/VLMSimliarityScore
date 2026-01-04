# Files to Refactor

> Generated on: 2026-01-04

## Summary
The inspection revealed significant coupling between the backend service layer and the HTTP transport layer, as well as a monolithic frontend component that violates detailed separation of concerns.

## Violations by Category

### Architecture Violations
| File | Violation | Recommendation |
|------|-----------|----------------|
| `app/services/vlm_engine.py` | Service layer depends on FastAPI's `UploadFile`. | Decouple `process_source` from `UploadFile`. Accept `bytes`, `file_path`, or `BinaryIO` instead. Move file handling logic to the controller or an adapter. |

### Backend Violations
| File | Violation | Recommendation |
|------|-----------|----------------|
| `app/services/vlm_engine.py` | `process_source` handles temporary file creation for uploads, mixing transport resource management with domain logic. | Move temporary file creation/management to `endpoints.py` or a dedicated resource manager. Service should operate on valid paths/streams. |
| `app/api/endpoints.py` | Manual `try...finally` block for cleaning up temp files is fragile and verbose. | encapsulating temp file lifecycle in a context manager or a dependency to ensure cleaner resource management. |

### Frontend Violations
| File | Violation | Recommendation |
|------|-----------|----------------|
| `src/components/Sidebar.tsx` | **Monolithic Component**: File is large (>400 lines) and uses an internal helper function `renderSourceSection` to render complex UI. | Extract `renderSourceSection` into a standalone `SourceSection.tsx` component. |
| `src/components/Sidebar.tsx` | **Prop Drilling / Tight Coupling**: Receives the entire `AppState` object, making it hard to test and reuse. | Pass only specific props needed by sub-components, or use a context provider to avoid prop drilling if moving to smaller components. |

### General Coding Standard Violations
| File | Violation | Recommendation |
|------|-----------|----------------|
| `src/components/MainContent.tsx` | Local state mixed with large render block (though improved by hooks, still large). | Consider breaking down into `ResultsDisplay.tsx` and `ConfigurationHeader.tsx` if complexity grows, but currently acceptable. |

## Priority Order
1. **[High]** Refactor `app/services/vlm_engine.py` to remove FastAPI dependency. This is a critical architectural violation ensuring the core engine is portable.
2. **[Medium]** Componentize `src/components/Sidebar.tsx`. Extract `SourceSection` to improve maintainability and readability.
3. **[Low]** cleanup `app/api/endpoints.py` temp file handling.

## Next Steps
1. Refactor `VLMService` to accept generic input types.
2. Update `endpoints.py` to handle file buffering/saving before calling service.
3. Extract `SourceSection` component from `Sidebar`.
