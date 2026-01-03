import { ChartConfiguration } from 'chart.js';

/**
 * Creates Chart.js configuration for similarity curve visualization.
 */
export function createSimilarityCurveConfig(
    labels: string[],
    scores: number[],
    labelTitle: string
): ChartConfiguration<'line'> {
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
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { display: true } },
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

    return null;
}
