import { useEffect, useRef, RefObject } from 'react';
import Chart from 'chart.js/auto';
import { createSimilarityCurveConfig, extractChartData } from '../utils/chartConfig';

/**
 * Hook for managing similarity curve Chart.js lifecycle.
 * Handles chart creation, updates, and cleanup.
 */
export function useSimilarityChart(
    chartRef: RefObject<HTMLCanvasElement | null>,
    results: any,
    selectedRow: number | null
) {
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
                    const config = createSimilarityCurveConfig(
                        chartData.labels,
                        chartData.scores,
                        chartData.labelTitle
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
    }, [results, selectedRow, chartRef]);

    return chartInstance;
}
