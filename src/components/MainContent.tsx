import { useRef, useState } from 'react';
import { Play, BarChart3, Clock, Grid, Activity, MousePointer2 } from 'lucide-react';
import { AppState, isSourceReady } from '../hooks/useAppState';
import { useSimilarityChart } from '../hooks/useSimilarityChart';
import { useHeatmapChart } from '../hooks/useHeatmapChart';
import VideoPlayer from './VideoPlayer';

interface MainContentProps {
    state: AppState;
    onCalculate: () => void;
    calculating: boolean;
    results: any;
}

export default function MainContent({ state, onCalculate, calculating, results }: MainContentProps) {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const heatmapRef = useRef<HTMLCanvasElement | null>(null);

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [showUpperTriangle, setShowUpperTriangle] = useState(false);

    // Use extracted hooks for chart logic
    useSimilarityChart(chartRef, results, selectedRow);

    const { hoverInfo, handleHeatmapMove, handleHeatmapLeave } = useHeatmapChart({
        heatmapRef,
        results,
        selectedRow,
        showUpperTriangle
    });

    // Use helper function from useAppState
    const isReady = isSourceReady(state);

    // Handle heatmap row selection
    const handleHeatmapClick = () => {
        if (hoverInfo) {
            setSelectedRow(hoverInfo.r);
        }
    };



    return (
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full relative overflow-y-auto bg-white scroll-smooth">
            <div className="max-w-5xl mx-auto w-full p-8 space-y-8">

                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Similarity Analysis</h2>
                    <p className="text-gray-500 mt-1">Configure sources on the left and run analysis.</p>
                </div>

                {/* QVHighlights Video Player */}
                {state.selectedQVQuery && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <VideoPlayer query={state.selectedQVQuery} />
                    </div>
                )}

                {/* Calculate Button */}
                <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                    <button
                        onClick={onCalculate}
                        disabled={!isReady || calculating}
                        className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg ${isReady && !calculating
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
                                <span>Calculate</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                {results && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                        {/* Metrics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Score Card */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                                    {results.type === 'scalar' ? 'Similarity Score' : 'Average Score'}
                                </span>
                                <div className="text-5xl font-black text-gray-900 tabular-nums tracking-tighter">
                                    {(results.score ?? results.average_score ?? 0).toFixed(4)}
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col justify-center space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Clock size={16} />
                                        <span className="text-sm font-medium">Time</span>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">{results.time_taken_ms.toFixed(0)} ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Activity size={16} />
                                        <span className="text-sm font-medium">Type</span>
                                    </div>
                                    <span className="text-sm font-bold bg-black text-white px-2 py-0.5 rounded uppercase text-[10px]">{results.type}</span>
                                </div>
                            </div>

                            {/* Best Frame (if curve/matrix) */}
                            {(results.best_frame || results.type === 'matrix') && (
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col justify-center">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Analysis</span>
                                    {results.best_frame && (
                                        <div className="mt-1">
                                            <p className="text-sm text-gray-600">Best match at <span className="font-bold text-black">{results.best_frame.time.toFixed(1)}s</span></p>
                                            <p className="text-xs text-green-600 font-medium pt-1">Score: {results.best_frame.score.toFixed(4)}</p>
                                        </div>
                                    )}
                                    {results.type === 'matrix' && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            Video-to-Video alignment computed.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Visualizations */}

                        {/* Matrix Heatmap */}
                        {results.type === 'matrix' && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-hidden">
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
                                            T(A): {results.matrix.rows_time[hoverInfo.r].toFixed(1)}s,
                                            T(B): {results.matrix.cols_time[hoverInfo.c].toFixed(1)}s
                                            = <span className="font-bold">{hoverInfo.val.toFixed(3)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="relative w-full flex justify-center bg-gray-50 rounded border border-gray-100 cursor-crosshair">
                                    <canvas
                                        ref={heatmapRef}
                                        onMouseMove={handleHeatmapMove}
                                        onMouseLeave={handleHeatmapLeave}
                                        onClick={handleHeatmapClick}
                                        className="max-h-[600px] w-full object-contain"
                                    />
                                </div>
                                <p className="text-xs text-center text-gray-400 mt-2">
                                    <MousePointer2 size={12} className="inline mr-1" />
                                    Click a row to view similarity curve for that Source A frame.
                                </p>
                            </div>
                        )}

                        {/* Line Chart */}
                        {(results.type === 'curve' || (results.type === 'matrix' && selectedRow !== null)) && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 text-gray-500">
                                    <BarChart3 size={20} />
                                    <span className="text-sm font-bold uppercase text-gray-700">
                                        {results.type === 'curve' ? 'Similarity Curve' : 'Frame Similarity Detail'}
                                    </span>
                                </div>
                                <div className="relative h-64 w-full">
                                    <canvas ref={chartRef}></canvas>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
