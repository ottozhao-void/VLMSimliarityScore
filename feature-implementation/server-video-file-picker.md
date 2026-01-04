# Server Video File Picker

## Goal
Implement an Obsidian Quick Switcher-style modal that allows users to browse, search, and select video files from a server-side directory (`/data1/zhaofanghan/vmr_dataset/qvhilights_videos`) when clicking "Upload Video".

## Context

### Relevant Existing Code
- [Sidebar.tsx](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/components/Sidebar.tsx) — `renderSourceSection()` handles video upload UI (lines 139-176)
- [endpoints.py](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/app/api/endpoints.py) — `/predict` endpoint accepts video files
- [useAppState.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/hooks/useAppState.ts) — app state management

### Tech Stack Constraints
- **Backend**: FastAPI (Python), server runs on Linux with access to the video directory
- **Frontend**: React 19, TypeScript, Lucide icons, Sonner notifications

---

## Requirements

### Functional Requirements

#### 1. Backend API
- **`GET /api/videos`**: List video files from the server directory
  - Parameters: `query` (string, fuzzy search), `limit` (int, default 50), `offset` (int, pagination)
  - Returns: `{ videos: [{ name: string, size: number, path: string }], total: number, hasMore: boolean }`
  - Uses fuzzy matching algorithm for search
  - Caches file list in memory to avoid repeated directory scans

- **`GET /api/videos/stream/{filename}`**: Stream video file to frontend for preview
  - Supports HTTP Range requests for seeking
  - Returns video with appropriate MIME type

#### 2. Frontend Modal Component
- **Trigger**: Additional option when Video type is selected (toggle between "Local Upload" and "Server Files")
- **Modal UI**: Obsidian Quick Switcher-style
  - Search input at top (auto-focused)
  - Scrollable list of video filenames
  - Keyboard navigation (↑/↓ to navigate, Enter to select, Esc to close)
  - Click to select
  - Loading indicator during search
  - "No results" state

#### 3. File Selection Flow
1. User selects "Video" source type
2. User toggles "Server Files" option
3. Modal opens with search input
4. User types to fuzzy-search
5. User selects a file
6. Selection is stored in app state (as server file path reference, not File object)
7. Backend reads file directly by path during `/predict`

### Non-Functional Requirements
- **Performance**: Paginated loading, max 50 results per request
- **No video preview**: No thumbnails or hover previews (confirmed)

---

## Technical Considerations

1. **State Management**: Need to distinguish between local `File` objects and server file paths in `useAppState`
2. **Backend Changes**: Modify `/predict` to accept server file paths in addition to file uploads
3. **Fuzzy Search Library**: Consider `fuzzywuzzy` (Python) for backend search
4. **Directory Caching**: Cache video file list on first load; add refresh mechanism if needed
5. **Security**: Validate that requested paths are within the allowed directory

---

## Acceptance Criteria

- [ ] Clicking "Upload Video" shows a toggle between "Local" and "Server"
- [ ] Selecting "Server" opens a modal with fuzzy-searchable video list
- [ ] Typing in search filters results in real-time
- [ ] Keyboard navigation works (↑/↓/Enter/Esc)
- [ ] Selecting a server video successfully runs `/predict` using that file
- [ ] Pagination works when scrolling or requesting more results
- [ ] Error states are handled gracefully (directory not found, file not accessible)
