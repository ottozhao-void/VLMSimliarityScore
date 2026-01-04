# QVHighlights Dataset Integration

## Goal
Extend the video source selection to support browsing and selecting videos from the **QVHighlights dataset**. Users can search through dataset annotations (JSONL) and select queries, which auto-populates both Source A and Source B with the corresponding video for self-similarity analysis.

## Context

### Relevant Existing Code
- [Sidebar.tsx](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/components/Sidebar.tsx) — Source selection UI with Video sub-mode toggle
- [ServerFilePicker.tsx](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/components/ServerFilePicker.tsx) — Existing Quick Switcher-style modal for video selection
- [useServerVideos.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/hooks/useServerVideos.ts) — Hook for fetching server videos with debounced search
- [useAppState.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/hooks/useAppState.ts) — App state with `SourceType`, `FileSource`
- [endpoints.py](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/app/api/endpoints.py) — API endpoints for video listing/streaming
- [video_browser_service.py](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/app/services/video_browser_service.py) — Backend service for video directory browsing
- [state.py](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/app/core/state.py) — Global model state singleton

### Tech Stack Constraints
- **Backend**: FastAPI, Python 3.10+
- **Frontend**: React 19, TypeScript, Lucide icons, Sonner notifications
- **Deployment**: Linux server at `10.184.17.30`

---

## Requirements

### Functional Requirements

#### 1. Video Source Mode Toggle
- Add **sub-modes** within the Video source type: `Local` and `QVHighlights`
- Toggle UI appears when Video is selected
- Default to `Local` mode (existing behavior)

#### 2. Settings Configuration (General Tab)
Add two new settings in the General settings menu:

| Setting | Description | Default |
|---------|-------------|---------|
| **Dataset Path** | Path to JSONL annotation files | `/data1/zhaofanghan/vmr_dataset/data/qvhighlights` |
| **Video Path** | Path to video files directory | `/data1/zhaofanghan/vmr_dataset/qvhilights_videos` |

- Both paths are **text inputs** with pre-configured defaults
- **Server-side validation** on save to verify paths exist
- Show error if validation fails

#### 3. Backend: JSONL Dataset Parsing
New endpoint to load and merge QVHighlights annotations:

**`GET /api/qvhighlights/queries`**
- Parameters: `query` (fuzzy search), `limit`, `offset`
- Reads all `.jsonl` files from the configured dataset path
- Merges entries and caches in memory
- Returns:
```json
{
  "queries": [
    {
      "qid": 8670,
      "query": "A man is talking to the camera when his friend appears behind him...",
      "vid": "1G5bSIisZSA_510.0_660.0",
      "duration": 150,
      "relevant_windows": [[134, 144], [146, 150]]
    }
  ],
  "total": 1000,
  "hasMore": true
}
```

**`POST /api/settings/paths`**
- Body: `{ datasetPath: string, videoPath: string }`
- Validates paths exist on server
- Stores in app config (or environment/state)
- Returns: `{ valid: boolean, errors: string[] }`

#### 4. Frontend: QVHighlights Query Picker
New modal component `QVHighlightsQueryPicker.tsx`:
- Similar to `ServerFilePicker` (Quick Switcher style)
- Displays each query entry showing:
  - **Query text** (primary, searchable)
  - **Video ID** (`vid`)
  - **Relevant windows** formatted as time ranges (e.g., "2:14-2:24, 2:26-2:30")
- Fuzzy search filters by query text
- Keyboard navigation (↑/↓/Enter/Esc)
- Pagination on scroll

#### 5. Auto-Populate Both Sources
When a QVHighlights query is selected:
1. Set `sourceAType` = `Video`, `sourceAFile` = `{ type: 'server', path: vid, name: vid }`
2. Set `sourceBType` = `Video`, `sourceBFile` = same as above
3. Store selected query metadata in state for display

#### 6. Video Player with Relevant Windows Highlighting
In `MainContent.tsx`, display a VideoPlayer component when a QVHighlights query is selected:
- Show video via streaming endpoint
- Display metadata panel:
  - **vid**: Video filename
  - **query**: The query text
  - **relevant_windows**: Time ranges
- **Visual highlighting**: Render colored segments on the video progress bar indicating `relevant_windows`

---

## Technical Considerations

1. **State Extensions**:
   - Add `videoSubMode: 'Local' | 'QVHighlights'` to `AppState`
   - Add `selectedQVQuery: QVHighlightsQuery | null` for metadata display
   - Add `datasetPath` and `videoPath` settings (persisted)

2. **New Service**: `QVHighlightsService` (Python)
   - Parse JSONL files
   - Cache merged data in memory
   - Fuzzy search using `fuzzywuzzy`
   - Validate paths exist

3. **New Hook**: `useQVHighlightsQueries` (TypeScript)
   - Similar to `useServerVideos`
   - Debounced search, pagination

4. **Video Player Enhancement**:
   - Overlay segments on seek bar
   - Use CSS or canvas for highlight rendering

5. **Settings Persistence**:
   - Store in `metadata.json` or new config file
   - Load on app startup

---

## Acceptance Criteria

- [ ] Video source type shows "Local" / "QVHighlights" toggle
- [ ] General settings has dataset path and video path inputs
- [ ] Path validation shows error if paths don't exist on server
- [ ] QVHighlights picker displays queries with vid and relevant_windows
- [ ] Fuzzy search filters queries in real-time
- [ ] Selecting a query auto-populates both Source A and Source B
- [ ] Video player displays with metadata (vid, query, relevant_windows)
- [ ] Relevant windows are visually highlighted on video progress bar
- [ ] Keyboard navigation works in picker (↑/↓/Enter/Esc)
- [ ] Pagination loads more results on scroll
