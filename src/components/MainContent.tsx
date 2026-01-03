import { useEffect, useRef } from 'react';
import { Play, BarChart3, Clock, Image as ImageIcon, Activity } from 'lucide-react';
import Chart from 'chart.js/auto';

interface MainContentProps {
    state: any;
    onCalculate: () => void;
    calculating: boolean;
    results: any;
}

export default function MainContent({ state, onCalculate, calculating, results }: MainContentProps) {
    const {
        imageSource, textSource, textInput, selectedImage, selectedVideo
    } = state;

    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const isReady = (
        (textSource === 'Random' || textInput.length > 0) &&
        (
            (imageSource === 'Image' && selectedImage) ||
            (imageSource === 'Video' && selectedVideo) ||
            imageSource === 'Random'
        )
    );

    useEffect(() => {
        if (results && results.type === 'video' && chartRef.current) {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const labels = results.frames.map((f: any) => f.time.toFixed(1) + 's');
                const scores = results.frames.map((f: any) => f.score);

                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Similarity Score',
                            data: scores,
                            borderColor: 'rgb(0, 0, 0)',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            tension: 0.3,
                            fill: true,
                            pointRadius: 2,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const val = context.parsed.y;
                                        return val !== null ? `Score: ${val.toFixed(4)}` : '';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                suggestedMin: -0.1,
                                suggestedMax: 1.0,
                                title: { display: true, text: 'Similarity' }
                            },
                            x: {
                                title: { display: true, text: 'Time (s)' }
                            }
                        }
                    }
                });
            }
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [results]);

    return (
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full relative overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto w-full p-8 space-y-8">

                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Similarity Analysis</h2>
                    <p className="text-gray-500 mt-1">Upload an image and provide a text prompt to measure semantic alignment.</p>
                </div>

                {/* Calculate Button */}
                <div className="flex items-center justify-end pt-6 border-t border-gray-100">
                    <button
                        onClick={onCalculate}
                        disabled={!isReady || calculating}
                        className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg ${isReady && !calculating
                            ? 'bg-black text-white hover:bg-gray-800 hover:shadow-xl active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {calculating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Computing...</span>
                            </>
                        ) : (
                            <>
                                <Play size={20} fill="currentColor" />
                                <span>Calculate Similarity</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Results */}
                {results && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 text-gray-500">
                                <BarChart3 size={20} />
                                <span className="text-sm font-medium uppercase tracking-wider">Analysis Results</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                                    <span className="text-sm text-gray-500 font-medium mb-2">
                                        {results.type === 'video' ? 'Average Similarity Score' : 'Semantic Similarity Score'}
                                    </span>
                                    <div className="text-6xl font-black text-gray-900 tracking-tight">
                                        {(results.type === 'video' ? results.average_score : results.score).toFixed(4)}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 w-full flex flex-col items-center">
                                        {results.type !== 'video' ? (
                                            <>
                                                <span className="text-xs text-gray-400 font-medium mb-1">Vector Angle</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-gray-700">{results.angle?.toFixed(2) || '0.0'}</span>
                                                    <span className="text-sm text-gray-400">deg</span>
                                                </div>
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-400">Video Analysis</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Clock size={18} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Inference Time</span>
                                        </div>
                                        <span className="text-lg font-bold text-gray-900">{results.time.toFixed(0)} ms</span>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <ImageIcon size={18} className="text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">Type</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{results.type === 'video' ? 'Video' : 'Image'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chart for Video */}
                            {results.type === 'video' && (
                                <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-gray-500">
                                        <Activity size={20} />
                                        <span className="text-sm font-medium uppercase tracking-wider">Similarity Timeline</span>
                                    </div>
                                    <div className="relative h-64 w-full">
                                        <canvas ref={chartRef}></canvas>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
