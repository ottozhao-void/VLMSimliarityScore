# Drag-and-Drop Replacement & Content Auto-Detection

## Overview
This feature enhances the user experience by allowing seamless content replacement and automatic mode switching through drag-and-drop interactions. Users no longer need to manually select the "Source Type" (Image, Video, etc.) before uploading a file.

## Key Capabilities

### 1. Unified Drop Zone
- **Behavior:** The entire "Source Settings" card (for both Source A and Source B) acts as a drop zone.
- **Visual Feedback:** A "Drop to replace" overlay appears when dragging a file over the source area, indicating that the drop is accepted.
- **Benefit:** Users don't need to aim for a specific "upload box" or clear the existing content first.

### 2. Intelligent Auto-Detection
- **Logic:** When a file is dropped, the system analyzes the file's MIME type.
    - If the file is an **Image** (`image/*`), the Source Type automatically switches to `Image`.
    - If the file is a **Video** (`video/*`), the Source Type automatically switches to `Video`.
- **Context Switching:** This works regardless of the current state.
    - *Example:* If Source A is currently set to "Text" mode with a typed prompt, dropping an image onto the card will discard the text mode, switch to "Image" mode, and load the dropped image immediately.

## Technical Implementation

### Components
- **File:** `src/components/Sidebar.tsx`
- **Function:** `handleFileDrop`

### Logic Flow
1.  **Event Capture:** The `onDrop` event is captured at the container level of the Source Section.
2.  **Type Check:** `e.dataTransfer.files[0].type` is checked.
3.  **State Update:**
    - `setType('Image' | 'Video')` is called to update the application state.
    - `setFile(file)` is called to store the file object.
4.  **UI Update:** The UI immediately reflects the new mode and displays the file preview.

## Usage Scenarios
1.  **Quickly testing different modalities:** A user comparing "Text vs Image" can quickly switch to "Image vs Image" by simply dragging an image onto the text source area.
2.  **Replacing content:** Replacing an uploaded video with a new test video requires only a single drag action, skipping the need to delete/clear the previous one.
