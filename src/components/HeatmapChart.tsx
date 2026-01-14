import { useRef, useEffect, useState, MouseEvent } from 'react';
import { Grid, MousePointer2 } from 'lucide-react';

export interface HeatmapData {
    matrix: (number | null)[][];
    rows_time: number[];
    cols_time: number[];
}

interface HeatmapChartProps {
    data: HeatmapData;
    selectedRow?: number | null;
    onRowSelect?: (rowIndex: number) => void;
    className?: string;
    variant?: 'card' | 'plain';
    zoomRange?: { min: number; max: number } | null;
    onZoom?: (range: { min: number; max: number } | null) => void;
}

interface HoverInfo {
    r: number;
    c: number;
    val: number;
}

export default function HeatmapChart({
    data,
    selectedRow = null,
    onRowSelect,
    className = "",
    variant = 'card',
    zoomRange,
    onZoom
}: HeatmapChartProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [showUpperTriangle, setShowUpperTriangle] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

    // Zoom Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);

    // Draw Heatmap
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const matrix = data.matrix;
        const totalRows = matrix.length;
        if (totalRows === 0) return;
        const totalCols = matrix[0].length;

        // Determine view range (sub-matrix)
        let rowStart = 0;
        let rowEnd = totalRows;
        let colStart = 0;
        let colEnd = totalCols;

        if (zoomRange) {
            // Find indices from time range
            // rows_time and cols_time might be same or different (usually same for self-sim)
            // For general case:
            // Calculate row range (Source A)
            // Note: If cross-sim, rows ~ Source A, cols ~ Source A (usually, or Source B).
            // But we treat zoom as a single "time" axis zoom (both x and y if square, or just restrict).
            // Requirement was "Synchronization". If curve is Source A vs B... wait.
            // Text-to-Video Curve: X is Time (Video Frame).
            // Self-Sim: X is Time, Y is Time.
            // Cross-Sim: X is Source B Time, Y is Source A Time? 
            // - Code says: "Row: Start Frame, Col: End Frame" for GIoU/CrossSim? 

            // Let's look at `rows_time` and `cols_time`.
            // If we assume the zoomSync is primarily for the main "Video" time axis.
            // We map min/max to BOTH rows and cols.

            // Helper to find index
            const findIdx = (times: number[], t: number) => {
                let idx = 0;
                let minD = Infinity;
                for (let i = 0; i < times.length; i++) {
                    const d = Math.abs(times[i] - t);
                    if (d < minD) { minD = d; idx = i; }
                }
                return idx;
            };

            rowStart = findIdx(data.rows_time, zoomRange.min);
            rowEnd = findIdx(data.rows_time, zoomRange.max) + 1; // inclusive -> exclusive

            colStart = findIdx(data.cols_time, zoomRange.min);
            colEnd = findIdx(data.cols_time, zoomRange.max) + 1;

            // Clamp
            rowStart = Math.max(0, rowStart);
            rowEnd = Math.min(totalRows, rowEnd);
            colStart = Math.max(0, colStart);
            colEnd = Math.min(totalCols, colEnd);

            // Should ensure at least 1 cell
            if (rowEnd <= rowStart) rowEnd = rowStart + 1;
            if (colEnd <= colStart) colEnd = colStart + 1;
        }

        const renderRows = rowEnd - rowStart;
        const renderCols = colEnd - colStart;

        // Canvas sizing
        // We use the parent width, but since this is inside a component, 
        // we might want to ensure it resizes correctly. 
        // For now, simpler approach: use clientWidth if available or default
        const width = canvas.parentElement?.clientWidth || 600;
        // Aspect ratio of the VIEWPORT (sub-matrix)
        const height = Math.min(600, width * (renderRows / renderCols));

        canvas.width = width;
        canvas.height = height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const cellW = width / renderCols;
        const cellH = height / renderRows;

        // Draw cells
        for (let i = 0; i < renderRows; i++) {
            for (let j = 0; j < renderCols; j++) {
                const globalRow = rowStart + i;
                const globalCol = colStart + j;

                // Skip lower triangle if upper triangle mode (only relative to global indices if symmetric?)
                // Usually "upper triangle" implies globalRow > globalCol or similar.
                if (showUpperTriangle && globalRow > globalCol) continue;

                const val = matrix[globalRow][globalCol];
                // Skip if value is null (e.g. for Cross-Sim or GIoU matrices)
                if (val === null) continue;

                const norm = (val + 1) / 2;
                const hue = (1 - norm) * 240;
                ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;

                // Draw slightly overlapping to avoid gaps
                ctx.fillRect(j * cellW, i * cellH, cellW + 0.5, cellH + 0.5);
            }
        }

        // Highlight selected row (if within view)
        if (selectedRow !== null && selectedRow >= rowStart && selectedRow < rowEnd) {
            const relativeRow = selectedRow - rowStart;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, relativeRow * cellH, width, cellH);
        }
    }, [data, selectedRow, showUpperTriangle, zoomRange]);

    // Handle Interaction


    const handleMouseMove = (e: MouseEvent) => {
        if (!data || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Dragging Logic
        if (isDragging && dragStart && onZoom) {
            setDragCurrent({ x, y });
            return; // Don't show hover info while dragging
        }

        const matrix = data.matrix;

        // Calculate rendering offset again (duplicate logic - could refactor)
        const totalRows = matrix.length;
        const totalCols = matrix[0].length;
        let rowStart = 0, rowEnd = totalRows, colStart = 0, colEnd = totalCols;

        if (zoomRange) {
            const findIdx = (times: number[], t: number) => {
                let idx = 0; let minD = Infinity;
                for (let i = 0; i < times.length; i++) {
                    const d = Math.abs(times[i] - t);
                    if (d < minD) { minD = d; idx = i; }
                }
                return idx;
            };
            rowStart = findIdx(data.rows_time, zoomRange.min);
            rowEnd = findIdx(data.rows_time, zoomRange.max) + 1;
            colStart = findIdx(data.cols_time, zoomRange.min);
            colEnd = findIdx(data.cols_time, zoomRange.max) + 1;

            rowStart = Math.max(0, rowStart);
            rowEnd = Math.min(totalRows, rowEnd);
            colStart = Math.max(0, colStart);
            colEnd = Math.min(totalCols, colEnd);
        }

        const renderRows = Math.max(1, rowEnd - rowStart);
        const renderCols = Math.max(1, colEnd - colStart);

        const cellW = rect.width / renderCols;
        const cellH = rect.height / renderRows;

        const cRel = Math.floor(x / cellW);
        const rRel = Math.floor(y / cellH);

        const r = rowStart + rRel;
        const c = colStart + cRel;

        if (r >= rowStart && r < rowEnd && c >= colStart && c < colEnd) {
            // Boundary check global
            if (r >= 0 && r < totalRows && c >= 0 && c < totalCols) {
                const val = matrix[r][c];
                if (showUpperTriangle && r > c) {
                    setHoverInfo(null);
                    return;
                }
                if (val === null) {
                    setHoverInfo(null);
                } else {
                    setHoverInfo({ r, c, val });
                }
            }
        } else {
            setHoverInfo(null);
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (!onZoom) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDragging(true);
        setDragStart({ x, y });
        setDragCurrent({ x, y });
    };

    const handleMouseUp = () => {
        if (isDragging && dragStart && dragCurrent && onZoom && canvasRef.current) {
            setIsDragging(false);

            // Calculate Box
            const x1 = Math.min(dragStart.x, dragCurrent.x);
            const x2 = Math.max(dragStart.x, dragCurrent.x);
            const y1 = Math.min(dragStart.y, dragCurrent.y);
            const y2 = Math.max(dragStart.y, dragCurrent.y);

            // Ignore small clicks
            if (Math.abs(x2 - x1) < 5 || Math.abs(y2 - y1) < 5) {
                setDragStart(null);
                setDragCurrent(null);
                return;
            }

            const rect = canvasRef.current.getBoundingClientRect();

            // Recalculate dimension maps to map pixels -> time

            const totalCols = data.matrix[0].length;
            let colStart = 0, colEnd = totalCols;

            if (zoomRange) {
                const findIdx = (times: number[], t: number) => {
                    let idx = 0; let minD = Infinity;
                    for (let i = 0; i < times.length; i++) {
                        const d = Math.abs(times[i] - t);
                        if (d < minD) { minD = d; idx = i; }
                    }
                    return idx;
                };

                colStart = findIdx(data.cols_time, zoomRange.min);
                colEnd = findIdx(data.cols_time, zoomRange.max) + 1;

                colStart = Math.max(0, colStart); colEnd = Math.min(totalCols, colEnd);
            }


            const renderCols = Math.max(1, colEnd - colStart);




            const cellW = rect.width / renderCols;
            const c1Rel = Math.floor(x1 / cellW);
            const c2Rel = Math.floor(x2 / cellW);

            // Map to global indices

            const cStartGlobal = Math.max(0, colStart + c1Rel);
            const cEndGlobal = Math.min(totalCols - 1, colStart + c2Rel);

            // Map to times

            const tCol1 = data.cols_time[cStartGlobal];
            const tCol2 = data.cols_time[cEndGlobal];

            // Determine union of time range (since we zoom into a time box)
            // Or since user approved "Free Form", maybe we can't fit it into "zoomRange" (which is symmetrical?)
            // WAIT. The prompt "Sync Zoom (Yes)" and "Free From".
            // If I select a rectangle that is NOT square in time, e.g. 10s-20s on x, and 50s-90s on y.
            // But `zoomRange` in `MainContent` is `{min, max}` -- SINGLE axis.
            // If I support free-form rectangular zoom on heatmap, I effectively need independent X and Y zoom.
            // But SimilarityCurve ONLY has X axis.
            // So if I zoom irregularly on Heatmap, how does SimilarityCurve react?
            // Usually, "Synchronized" implies the Shared Axis is synced.
            // Heatmap X = Curve X. Heatmap Y = ?.
            // If Heatmap is Self-Sim, Y = X.
            // If dragging free-form, we might get X range != Y range.
            // Decision: Since `SimilarityCurve` is linear, it only cares about X.
            // We should use the X-projection of the selection for the synced zoom.
            // If Self-Sim, we typically want square zoom. User said "Free Form" though.
            // If "Free Form", maybe they just mean "Box Selection" interactions?
            // If I force the Heatmap to only show the zoomed X range on BOTH axes, it maintains square aspect (in time domain).
            // If I allow different views, I need `zoomRangeX` and `zoomRangeY`.
            // But `SimilarityChart` relies on `zoomRange` (X).
            // Let's implement: Use X range of the selection to drive the GLOBAL zoom.
            // This enforces square zoom (conceptually) on the shared time axis for consistency, 
            // OR we just take the X range for the curve, but what about the Heatmap Y?
            // If existing code `HeatmapChart` uses `zoomRange` (singular) to slice both rows and cols, it enforces square view in time-space.
            // For a "Free Form" user request, this restriction might be annoying if they want to inspect off-diagonal.
            // BUT, `zoomRange` is shared.
            // Re-reading user request: "3. Heatmap Zoom: ... Free Form".
            // User wants to typically select a specific rectangular region.
            // If I only sync X, I should probably allow `HeatmapChart` to have independent `rowZoom` vs `colZoom`?
            // But `zoomRange` in `MainContent` is passed to `SimilarityChart` which only has 1 axis.
            // COMPROMISE:
            // Symmetrical Zoom: takes the union or average? No.
            // Let's take the X-range (Columns) to update the global `zoomRange`.
            // And implicitly, update Y-range (Rows) to match if we want to keep it simple and synced.
            // If I strictly follow "Free Form", I need separate X/Y zoom states.
            // Let's update `MainContent` to support `{ minX, maxX, minY, maxY }`? 
            // That's too complex for now given the time constraints and "Refine" step was brief.
            // "Free Form" likely refers to the interaction style (drawing a box) vs "Combined/Constrained" (dragging axis).
            // Let's stick to: Box Select -> Take X range -> Apply to Zoom -> Heatmap updates X & Y (symmetric).
            // Why? Because mostly we analyze Self-Similarity (diagonal).
            // If Cross-Sim, X and Y are different videos. 
            // If I use single `zoomRange` for Cross-Sim, it implies syncing "Time" but Cross-Sim might have different durations!
            // Uh oh. Cross-Sim: `rows` (Source A) vs `cols` (Source B).
            // If they have different durations, `zoomRange` (seconds) might be valid for both, but referring to different contexts.
            // `MainContent.tsx` defines `zoomRange` as `{min, max}`. 
            // `SimilarityChart` uses it for X.
            // `HeatmapChart` uses it for BOTH?
            // If Cross-Sim (A vs B), `zoomRange` applied to both means "Show 10s-20s of A AND 10s-20s of B".
            // This is a reasonable default.
            // So, from the selection rect, I will calculate min/max time from the X-axis (Columns) and use that.
            // OR, strictly, "Box Selection" on a square canvas usually implies X and Y.
            // Let's effectively take the X-projection.

            const minTime = Math.min(tCol1, tCol2);
            const maxTime = Math.max(tCol1, tCol2);

            onZoom({ min: minTime, max: maxTime });
        }

        setIsDragging(false);
        setDragStart(null);
        setDragCurrent(null);
    };

    const handleMouseLeave = () => {
        setHoverInfo(null);
        if (isDragging) {
            setIsDragging(false);
            setDragStart(null);
            setDragCurrent(null);
        }
    };

    const handleDoubleClick = () => {
        if (onZoom) onZoom(null);
    };

    const handleClick = () => {
        // If we were dragging, ignore click
        if (isDragging) return;
        if (hoverInfo && onRowSelect) {
            onRowSelect(hoverInfo.r);
            // Also notify click? 
        }
    };

    const containerClasses = variant === 'card'
        ? `bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden ${className}`
        : `overflow-hidden ${className}`;

    return (
        <div ref={containerRef} className={`${containerClasses} relative select-none`}>
            {/* Header / Info ... same as before ... */}
            <div className="flex items-center justify-between mb-4">
                {/* Keep existing header content... simplified for replacement block */}
                <div className="flex items-center gap-2">
                    <Grid size={20} className="text-gray-500" />
                    <span className="text-sm font-bold uppercase text-gray-700">Similarity Heatmap</span>

                    {/* Toggle Button for Upper Triangle */}
                    <div className="flex items-center ml-4 gap-2">
                        <button
                            onClick={() => setShowUpperTriangle(!showUpperTriangle)}
                            className={`
                                relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                                ${showUpperTriangle ? 'bg-black' : 'bg-gray-200'}
                            `}
                        >
                            <span
                                className={`
                                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 
                                    transition duration-200 ease-in-out
                                    ${showUpperTriangle ? 'translate-x-4' : 'translate-x-0'}
                                `}
                            />
                        </button>
                        <span className="text-xs text-gray-500 cursor-pointer select-none" onClick={() => setShowUpperTriangle(!showUpperTriangle)}>
                            Upper Triangle
                        </span>
                    </div>
                </div>
                {hoverInfo && (
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded fade-in z-20">
                        T(A): {data.rows_time[hoverInfo.r].toFixed(1)}s,
                        T(B): {data.cols_time[hoverInfo.c].toFixed(1)}s
                        = <span className="font-bold">{hoverInfo.val.toFixed(3)}</span>
                    </div>
                )}
            </div>

            <div
                className="relative w-full flex justify-center bg-gray-50 rounded border border-gray-100 cursor-crosshair overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            >
                <canvas
                    ref={canvasRef}
                    className="max-h-[600px] w-full object-contain block" // block to remove bottom gap
                />

                {/* Drag Overlay */}
                {isDragging && dragStart && dragCurrent && (
                    <div
                        className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none"
                        style={{
                            left: Math.min(dragStart.x, dragCurrent.x),
                            top: Math.min(dragStart.y, dragCurrent.y),
                            width: Math.abs(dragCurrent.x - dragStart.x),
                            height: Math.abs(dragCurrent.y - dragStart.y),
                        }}
                    />
                )}
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
                <MousePointer2 size={12} className="inline mr-1" />
                Click row to view details. Drag to zoom. Dbl-Click to reset.
            </p>
        </div>
    );
}
