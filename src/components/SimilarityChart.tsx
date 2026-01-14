import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { BarChart3, MousePointer2, ImageIcon, Copy, Check } from 'lucide-react';
import { createSimilarityCurveConfig, extractChartData, ChartClickOptions } from '../utils/chartConfig';

export interface SimilarityChartProps {
    results: any;
    selectedRow: number | null;
    onPointClick?: (timeSeconds: number, index: number) => void;
    sourceATime?: number;
    relevantWindows?: number[][];  // Array of [start, end] time pairs for relevant windows
    className?: string;
    variant?: 'card' | 'plain';
    // Copy button props (optional, renders in chart top-right when provided)
    showCopyButton?: boolean;
    isCopied?: boolean;
    onCopy?: () => void;

    // Zoom props
    zoomRange?: { min: number; max: number } | null;
    onZoom?: (range: { min: number; max: number } | null) => void;
}

export default function SimilarityChart({
    results,
    selectedRow,
    onPointClick,
    sourceATime,
    relevantWindows,
    className = "",
    variant = 'card',
    showCopyButton = false,
    isCopied = false,
    onCopy,
    zoomRange,
    onZoom
}: SimilarityChartProps) {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<Chart | null>(null);

    // Initialize/Update Chart
    useEffect(() => {
        const shouldShowChart =
            (results?.type === 'curve') ||
            (results?.type === 'matrix' && selectedRow !== null) ||
            (results?.type === 'dataset' && results?.curve);

        if (shouldShowChart && chartRef.current) {
            // Destroy existing chart if data context completely changes or relies on non-updateable config
            // However, for smoother updates, we might want to update data instead of destroy.
            // For now, keep destroy/recreate pattern as it ensures config consistency (annotations etc).
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const chartData = extractChartData(results, selectedRow);

                if (chartData) {
                    // Build chart options
                    const chartOptions: ChartClickOptions = {};

                    if (onPointClick) {
                        chartOptions.onPointClick = (index, timeLabel) => {
                            // Parse time from label (e.g., "1.5s" -> 1.5)
                            const timeSeconds = parseFloat(timeLabel.replace('s', ''));
                            onPointClick(timeSeconds, index);
                        };
                    }

                    if (sourceATime !== undefined) {
                        chartOptions.sourceAAnnotationTime = sourceATime;
                    }

                    if (relevantWindows && relevantWindows.length > 0) {
                        chartOptions.relevantWindows = relevantWindows;
                    }

                    // Handle Zoom Complete (Outbound)
                    if (onZoom) {
                        chartOptions.onZoomComplete = (min, max) => {
                            onZoom({ min, max });
                        };
                    }

                    const config = createSimilarityCurveConfig(
                        chartData.labels,
                        chartData.scores,
                        chartData.labelTitle,
                        chartOptions
                    );

                    chartInstance.current = new Chart(ctx, config);
                }
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [results, selectedRow, onPointClick, sourceATime, relevantWindows, onZoom /* Re-create if zoom handler changes */]);

    // Handle External Zoom Changes (Inbound)
    useEffect(() => {
        const chart = chartInstance.current;
        if (!chart) return;

        if (zoomRange) {
            // Programmatically zoom/pan to range
            // We need to map time (seconds) to scale indices or values
            // Our config uses labels array "0.0s", "0.5s".
            // We need to find the specific labels or indices effectively.

            // To make this robust, we should probably access the chart data to find indices
            const dataLabels = chart.data.labels as string[];
            if (!dataLabels) return;

            // Simple map helper
            const times = dataLabels.map(l => parseFloat(l.replace('s', '')));

            // Find closest indices
            let minIndex = 0;
            let maxIndex = times.length - 1;

            // Optimized scan or just simple scan
            let minDiff = Infinity;
            let maxDiff = Infinity;

            times.forEach((t, i) => {
                const dMin = Math.abs(t - zoomRange.min);
                if (dMin < minDiff) { minDiff = dMin; minIndex = i; }

                const dMax = Math.abs(t - zoomRange.max);
                if (dMax < maxDiff) { maxDiff = dMax; maxIndex = i; }
            });

            // Apply zoom to x scale
            if (chart.scales.x) {
                const x = chart.scales.x;
                // For category axis, we set min/max to indices (if configured as such) or values?
                // Start with update options

                // Use chartjs-plugin-zoom's zoomScale api if possible, or just set min/max options
                x.options.min = minIndex;
                x.options.max = maxIndex;
                chart.update('none'); // Update without animation for sync feel
            }
        } else {
            // Reset Zoom
            chart.resetZoom();
        }
    }, [zoomRange]);

    // Double click to reset
    const handleDoubleClick = () => {
        if (onZoom) {
            onZoom(null); // Clear zoom state in parent
        }
        if (chartInstance.current) {
            chartInstance.current.resetZoom();
        }
    };

    // Determine Title based on type
    const title = results?.type === 'curve' ? 'Similarity Curve' : 'Frame Similarity Detail';

    // Check if we should render context badge (Matrix mode detailed view)
    const showContextBadge = results?.type === 'matrix' && selectedRow !== null && results.matrix?.rows_time;

    const containerClasses = variant === 'card'
        ? `bg-white border border-gray-200 rounded-2xl p-6 shadow-sm ${className}`
        : `${className}`;

    return (
        <div className={containerClasses}>
            {variant === 'card' && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <BarChart3 size={20} />
                        <span className="text-sm font-bold uppercase text-gray-700">
                            {title}
                        </span>
                    </div>

                    {/* Source A Frame Context (for matrix mode) */}
                    {showContextBadge && (
                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            <ImageIcon size={14} className="text-blue-500" />
                            <span className="text-xs text-blue-700 font-medium">
                                Source A @ {results.matrix.rows_time[selectedRow].toFixed(1)}s
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Click instruction */}
            <p className="text-xs text-gray-400 mb-3">
                <MousePointer2 size={12} className="inline mr-1" />
                Click point to seek. Drag to zoom. Double-click to reset.
            </p>

            <div
                className="relative h-64 w-full cursor-pointer"
                onDoubleClick={handleDoubleClick}
            >
                {/* Copy Button - top-right of chart */}
                {showCopyButton && onCopy && (
                    <button
                        onClick={onCopy}
                        className={`absolute top-0 right-0 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isCopied
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
                            }`}
                        title="Copy similarity values to clipboard"
                    >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                )}
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
}
