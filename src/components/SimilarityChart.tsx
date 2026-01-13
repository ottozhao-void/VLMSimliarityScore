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
    onCopy
}: SimilarityChartProps) {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        const shouldShowChart =
            (results?.type === 'curve') ||
            (results?.type === 'matrix' && selectedRow !== null) ||
            (results?.type === 'dataset' && results?.curve);

        if (shouldShowChart && chartRef.current) {
            // Destroy existing chart
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
    }, [results, selectedRow, onPointClick, sourceATime, relevantWindows]);

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
                Click on any point to seek the video to that timestamp.
            </p>

            <div className="relative h-64 w-full cursor-pointer">
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
