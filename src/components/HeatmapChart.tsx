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
    variant = 'card'
}: HeatmapChartProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [showUpperTriangle, setShowUpperTriangle] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

    // Draw Heatmap
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const matrix = data.matrix;
        const rows = matrix.length;
        if (rows === 0) return;
        const cols = matrix[0].length;

        // Canvas sizing
        // We use the parent width, but since this is inside a component, 
        // we might want to ensure it resizes correctly. 
        // For now, simpler approach: use clientWidth if available or default
        const width = canvas.parentElement?.clientWidth || 600;
        const height = Math.min(600, width * (rows / cols));

        canvas.width = width;
        canvas.height = height;

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
                // Skip if value is null (e.g. for Cross-Sim or GIoU matrices)
                if (val === null) continue;

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
    }, [data, selectedRow, showUpperTriangle]);

    // Handle Interaction
    const handleMouseMove = (e: MouseEvent) => {
        if (!data || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const matrix = data.matrix;
        const rows = matrix.length;
        const cols = matrix[0].length;

        const cellW = rect.width / cols;
        const cellH = rect.height / rows;

        const c = Math.floor(x / cellW);
        const r = Math.floor(y / cellH);

        if (r >= 0 && r < rows && c >= 0 && c < cols) {
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
        } else {
            setHoverInfo(null);
        }
    };

    const handleMouseLeave = () => {
        setHoverInfo(null);
    };

    const handleClick = () => {
        if (hoverInfo && onRowSelect) {
            onRowSelect(hoverInfo.r);
        }
    };

    const containerClasses = variant === 'card'
        ? `bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden ${className}`
        : `overflow-hidden ${className}`;

    return (
        <div className={containerClasses}>
            <div className="flex items-center justify-between mb-4">
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
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded fade-in">
                        T(A): {data.rows_time[hoverInfo.r].toFixed(1)}s,
                        T(B): {data.cols_time[hoverInfo.c].toFixed(1)}s
                        = <span className="font-bold">{hoverInfo.val.toFixed(3)}</span>
                    </div>
                )}
            </div>

            <div className="relative w-full flex justify-center bg-gray-50 rounded border border-gray-100 cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                    className="max-h-[600px] w-full object-contain"
                />
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">
                <MousePointer2 size={12} className="inline mr-1" />
                Click a row to view similarity curve for that Source A frame.
            </p>
        </div>
    );
}
