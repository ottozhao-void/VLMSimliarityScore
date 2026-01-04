import { useEffect, useRef, RefObject } from 'react';
import Chart from 'chart.js/auto';
import { createSimilarityCurveConfig, extractChartData, ChartClickOptions } from '../utils/chartConfig';

export interface SimilarityChartParams {
    chartRef: RefObject<HTMLCanvasElement | null>;
    results: any;
    selectedRow: number | null;
    onPointClick?: (timeSeconds: number, index: number) => void;
    sourceATime?: number;  // For vertical annotation line
}

/**
 * Hook for managing similarity curve Chart.js lifecycle.
 * Handles chart creation, updates, cleanup, and click interactions.
 */
export function useSimilarityChart({
    chartRef,
    results,
    selectedRow,
    onPointClick,
    sourceATime
}: SimilarityChartParams) {
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        const shouldShowChart =
            (results?.type === 'curve') ||
            (results?.type === 'matrix' && selectedRow !== null);

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
    }, [results, selectedRow, chartRef, onPointClick, sourceATime]);

    return chartInstance;
}

