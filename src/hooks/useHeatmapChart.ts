import { useEffect, RefObject, useState } from 'react';

interface HeatmapParams {
    heatmapRef: RefObject<HTMLCanvasElement | null>;
    results: any;
    selectedRow: number | null;
    showUpperTriangle: boolean;
}

interface HoverInfo {
    r: number;
    c: number;
    val: number;
}

/**
 * Hook for managing heatmap canvas rendering and interactions.
 */
export function useHeatmapChart({ heatmapRef, results, selectedRow, showUpperTriangle }: HeatmapParams) {
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

    // Render heatmap when results or settings change
    useEffect(() => {
        if (results?.type === 'matrix' && heatmapRef.current && results.matrix) {
            const canvas = heatmapRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                const matrix = results.matrix.matrix;
                const rows = matrix.length;
                const cols = matrix[0].length;

                // Canvas sizing
                const width = canvas.width = canvas.parentElement?.clientWidth || 600;
                const height = canvas.height = Math.min(600, width * (rows / cols));

                // Clear canvas
                ctx.clearRect(0, 0, width, height);

                const cellW = width / cols;
                const cellH = height / rows;

                // Draw cells
                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        // Skip lower triangle if upper triangle mode
                        if (showUpperTriangle && i > j) continue;

                        const val = matrix[i][j];
                        const norm = (val + 1) / 2;
                        const hue = (1 - norm) * 240;
                        ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
                        ctx.fillRect(j * cellW, i * cellH, cellW, cellH);
                    }
                }

                // Highlight selected row
                if (selectedRow !== null) {
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(0, selectedRow * cellH, width, cellH);
                }
            }
        }
    }, [results, selectedRow, showUpperTriangle, heatmapRef]);

    // Handle mouse move over heatmap
    const handleHeatmapMove = (e: React.MouseEvent) => {
        if (!results || results.type !== 'matrix' || !heatmapRef.current) return;

        const rect = heatmapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const matrix = results.matrix.matrix;
        const rows = matrix.length;
        const cols = matrix[0].length;

        const cellW = rect.width / cols;
        const cellH = rect.height / rows;

        const c = Math.floor(x / cellW);
        const r = Math.floor(y / cellH);

        if (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (showUpperTriangle && r > c) {
                setHoverInfo(null);
                return;
            }
            setHoverInfo({ r, c, val: matrix[r][c] });
        } else {
            setHoverInfo(null);
        }
    };

    const handleHeatmapLeave = () => {
        setHoverInfo(null);
    };

    return {
        hoverInfo,
        handleHeatmapMove,
        handleHeatmapLeave
    };
}
