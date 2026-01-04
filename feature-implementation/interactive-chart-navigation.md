# Interactive Chart Navigation & Video Seek

## Goal
Enhance the user experience by enabling **interactive navigation** between similarity charts and video playback. Users can click on chart points to seek videos, visualize relevant windows on the progress bar, and trigger calculations with a global keyboard shortcut.

## Context

### Relevant Existing Code
- [MainContent.tsx](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/components/MainContent.tsx) — Results display with Frame Similarity Detail chart and heatmap
- [VideoPlayer.tsx](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/components/VideoPlayer.tsx) — QVHighlights video player with progress bar
- [useSimilarityChart.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/hooks/useSimilarityChart.ts) — Chart.js lifecycle hook for similarity curves
- [useHeatmapChart.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/hooks/useHeatmapChart.ts) — Heatmap rendering with click/hover handlers
- [chartConfig.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/utils/chartConfig.ts) — Chart.js configuration for similarity curves
- [useAppState.ts](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/hooks/useAppState.ts) — App state with `selectedQVQuery`, video sources
- [App.tsx](file:///c:/Users/Hasee/Desktop/VLMSimliarityScore/src/App.tsx) — Top-level component where global shortcuts can be registered

### Tech Stack Constraints
- **Frontend**: React 19, TypeScript, Chart.js, Lucide icons
- **Video**: HTML5 `<video>` element with `currentTime` API for seeking
- **Charting**: Chart.js with click event handlers

---

## Requirements

### 1. Click Frame Similarity Detail → Seek Source B Video

**Description**: When viewing the "Frame Similarity Detail" chart (appears after selecting a heatmap row in matrix mode), clicking on any point should seek the **Source B video** to the corresponding timestamp.

**Behavior**:
- Click event on the line chart triggers video seek
- Target: Source B video's `currentTime` is set to the clicked X-axis value (time in seconds)
- Works for **all video modes**: QVHighlights and locally-uploaded videos

**UI Additions**:
- **Source A Frame Thumbnail**: Display a small thumbnail/preview of the Source A frame (the selected row) somewhere near the chart. This provides context for what Source A frame is being compared.
- **Dotted Vertical Line**: Add a **dotted vertical line** on the chart at the Source A frame's timestamp, visually indicating the "reference point" being compared.

**Technical Notes**:
- Need a video ref accessible from `MainContent.tsx` to control playback
- For local videos, may need to create a unified video player component or extend existing logic
- Chart.js `onClick` handler can return the data index → map to `cols_time[index]`

---

### 2. Video-Query Similarity Curve on Progress Bar (QVHighlights Mode)

**Description**: In QVHighlights mode, overlay a **similarity curve** on the video progress bar. This curve shows the VLM-computed similarity between each video frame and the **query text** (the QVHighlights query associated with the video).

**Visual Design**:
- Overlay the curve **behind** the existing blue `relevant_windows` segments
- Curve height represents similarity score (0 to 1)
- Use subtle styling (e.g., semi-transparent fill) so it doesn't obscure playback controls

**Relevant Windows Markers**:
- Draw **blue dashed vertical lines** at the start and end boundaries of each `relevant_window`
- These lines should be clearly visible on the progress bar overlay

**Data Source**:
- Uses `results.curve` data computed from VLM between video frames and the query text
- Requires a similarity calculation to have been run first

---

### 3. Click Relevant Windows → Seek to Start

**Description**: Users can click on `relevant_windows` to seek the video to the beginning of that window.

**Click Targets (Both)**:
1. **Badge pills** in the metadata panel (e.g., "2:14-2:24" time range badges)
2. **Blue segments** on the custom progress bar

**Behavior**:
- Clicking either target seeks video to the **start** of that relevant window
- Add visual feedback (e.g., cursor pointer, subtle hover effect)

**Technical Notes**:
- Badge pills: Add `onClick` handler with `video.currentTime = window[0]`
- Progress bar segments: Already positioned, add click handler

---

### 4. Calculate Shortcut Key

**Description**: Global keyboard shortcut to trigger the "Calculate" action.

**Shortcut**: `Ctrl+Shift+C` (Windows/Linux) / `Cmd+Shift+C` (Mac)

**Behavior**:
- Works **globally** on the page, regardless of focus
- Only triggers if sources are ready and not already calculating
- Should not conflict with browser shortcuts (Ctrl+Shift+C is safe — it's not a common browser shortcut)

**Technical Notes**:
- Register `keydown` event listener in `App.tsx` or `MainContent.tsx`
- Check for `event.ctrlKey && event.shiftKey && event.key === 'C'`
- Call `onCalculate()` if `isReady && !calculating`

---

## Technical Considerations

### State Extensions
- **Video ref forwarding**: Need to pass `videoRef` from `VideoPlayer.tsx` up to `MainContent.tsx` for programmatic seeking
- **Source A context**: Store selected row's timestamp for displaying thumbnail and dotted line

### Chart.js Modifications
- Add `onClick` plugin/option to `useSimilarityChart.ts`
- Modify `chartConfig.ts` to support vertical annotation lines

### VideoPlayer Enhancements
- Add similarity curve overlay (canvas or styled div behind progress bar)
- Add click handlers to progress bar segments
- Add click handlers to badge pills

### Global Shortcut
- Use `useEffect` with `keydown` listener in top-level component
- Ensure cleanup on unmount

---

## Acceptance Criteria

- [ ] Clicking Frame Similarity Detail chart point seeks Source B video to corresponding time
- [ ] Source A frame thumbnail displayed near the chart
- [ ] Dotted vertical line shown on chart at Source A's timestamp
- [ ] Feature works for both QVHighlights and local video modes
- [ ] Similarity curve overlaid on video progress bar in QVHighlights mode
- [ ] Blue dashed lines mark `relevant_windows` boundaries on curve
- [ ] Clicking badge pills seeks video to window start
- [ ] Clicking progress bar segments seeks video to window start
- [ ] `Ctrl+Shift+C` triggers Calculate action globally
- [ ] Shortcut respects `isReady` and `calculating` states
