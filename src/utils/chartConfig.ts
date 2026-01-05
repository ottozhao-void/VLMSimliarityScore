import { ChartConfiguration, Chart } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register the annotation plugin
Chart.register(annotationPlugin);

export interface ChartClickOptions {
    onPointClick?: (index: number, timeLabel: string) => void;
    sourceAAnnotationTime?: number;  // Time in seconds for vertical dotted line
    relevantWindows?: number[][];    // Array of [start, end] time pairs for relevant windows
}

/**
 * Creates Chart.js configuration for similarity curve visualization.
 * Supports optional click handler and Source A annotation line.
 */
export function createSimilarityCurveConfig(
    labels: string[],
    scores: number[],
    labelTitle: string,
    options?: ChartClickOptions
): ChartConfiguration<'line'> {
    const { onPointClick, sourceAAnnotationTime, relevantWindows } = options || {};

    // Parse time labels once for index finding
    const timeLabels = labels.map(l => parseFloat(l.replace('s', '')));

    // Helper function to find closest label index for a given time
    const findClosestIndex = (targetTime: number): number => {
        let closestIndex = 0;
        let minDiff = Math.abs(timeLabels[0] - targetTime);
        for (let i = 1; i < timeLabels.length; i++) {
            const diff = Math.abs(timeLabels[i] - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }
        return closestIndex;
    };

    // Build annotation config
    const annotationConfig: any = {};

    // Add sourceA annotation line if provided
    if (sourceAAnnotationTime !== undefined) {
        const annotationIndex = findClosestIndex(sourceAAnnotationTime);

        annotationConfig.sourceALine = {
            type: 'line',
            xMin: annotationIndex,
            xMax: annotationIndex,
            borderColor: 'rgba(59, 130, 246, 0.8)',  // Blue color
            borderWidth: 2,
            borderDash: [5, 5],  // Dotted line
            label: {
                display: true,
                content: `Source A: ${sourceAAnnotationTime.toFixed(1)}s`,
                position: 'start',
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                color: 'white',
                font: { size: 10 }
            }
        };
    }

    // Add relevant windows annotation lines (dashed lines for start/end boundaries)
    if (relevantWindows && relevantWindows.length > 0) {
        relevantWindows.forEach(([start, end], windowIndex) => {
            const startIndex = findClosestIndex(start);
            const endIndex = findClosestIndex(end);

            // Start boundary line
            annotationConfig[`relevantWindowStart${windowIndex}`] = {
                type: 'line',
                xMin: startIndex,
                xMax: startIndex,
                borderColor: 'rgba(59, 130, 246, 0.7)',  // Blue color
                borderWidth: 2,
                borderDash: [6, 4],  // Dashed line
                label: {
                    display: windowIndex === 0,  // Only show label on first window
                    content: `Start: ${start.toFixed(1)}s`,
                    position: 'start',
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    color: 'white',
                    font: { size: 9 }
                }
            };

            // End boundary line
            annotationConfig[`relevantWindowEnd${windowIndex}`] = {
                type: 'line',
                xMin: endIndex,
                xMax: endIndex,
                borderColor: 'rgba(59, 130, 246, 0.7)',  // Blue color
                borderWidth: 2,
                borderDash: [6, 4],  // Dashed line
                label: {
                    display: windowIndex === 0,  // Only show label on first window
                    content: `End: ${end.toFixed(1)}s`,
                    position: 'start',
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    color: 'white',
                    font: { size: 9 }
                }
            };
        });
    }


    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: labelTitle,
                data: scores,
                borderColor: 'rgb(0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                tension: 0.2,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointHitRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            onClick: onPointClick ? (_event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    onPointClick(index, labels[index]);
                }
            } : undefined,
            plugins: {
                legend: { display: true },
                annotation: {
                    annotations: annotationConfig
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 1,
                    beginAtZero: true,
                    suggestedMin: 0,
                    title: { display: true, text: 'Cosine Similarity' }
                }
            }
        }
    };
}

/**
 * Extracts chart data from results based on type.
 */
export function extractChartData(
    results: any,
    selectedRow: number | null
): { labels: string[]; scores: number[]; labelTitle: string } | null {
    if (!results) return null;

    if (results.type === 'curve') {
        return {
            labels: results.curve.map((f: any) => f.time.toFixed(1) + 's'),
            scores: results.curve.map((f: any) => f.score),
            labelTitle: 'Similarity Curve'
        };
    }

    if (results.type === 'matrix' && selectedRow !== null) {
        const rowData = results.matrix.matrix[selectedRow];
        return {
            labels: results.matrix.cols_time.map((t: number) => t.toFixed(1) + 's'),
            scores: rowData,
            labelTitle: `Similarity for Source A at ${results.matrix.rows_time[selectedRow].toFixed(1)}s`
        };
    }

    // Handle dataset type with curve data
    if (results.type === 'dataset') {
        // If a row is selected in matrix mode inside dataset, show that row's similarity
        if (selectedRow !== null && results.matrix) {
            const rowData = results.matrix.matrix[selectedRow];
            return {
                labels: results.matrix.cols_time.map((t: number) => t.toFixed(1) + 's'),
                scores: rowData,
                labelTitle: `Similarity for Source A at ${results.matrix.rows_time[selectedRow].toFixed(1)}s`
            };
        }

        // Otherwise show the global curve
        if (results.curve) {
            return {
                labels: results.curve.map((f: any) => f.time.toFixed(1) + 's'),
                scores: results.curve.map((f: any) => f.score),
                labelTitle: 'Text-to-Video Similarity'
            };
        }
    }

    return null;
}
