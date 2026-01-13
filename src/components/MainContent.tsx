import { useRef, useState, useMemo, useEffect } from 'react';
import { BarChart3, Clock, Grid, Activity, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AppState } from '../hooks/useAppState';
import HeatmapChart from './HeatmapChart';
import SimilarityChart from './SimilarityChart';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';

import { AnalysisResults } from '../types';

interface MainContentProps {
    state: AppState;
    results: AnalysisResults | null;
}

export default function MainContent({ state, results }: MainContentProps) {
    const videoPlayerRef = useRef<VideoPlayerHandle>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [datasetActiveTab, setDatasetActiveTab] = useState<'matrix' | 'curve'>('curve');

    const [isCopied, setIsCopied] = useState(false);

    // Handle copy similarity values to clipboard
    const handleCopySimilarityValues = () => {
        if (!results?.curve?.scores) {
            toast.error('No similarity data to copy');
            return;
        }

        const { scores, time_labels } = results.curve;
        const lines = scores.map((score: number, index: number) => {
            const time = time_labels?.[index] ?? `${index * (results.curve.fps ? 1 / results.curve.fps : 1)}s`;
            return `${time}\t${score.toFixed(6)}`;
        });

        const header = 'Time\tSimilarity Score';
        const text = [header, ...lines].join('\n');

        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            toast.success('Similarity values copied to clipboard');
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(() => {
            toast.error('Failed to copy to clipboard');
        });
    };

    // Reset selected row when switching tabs or results change
    useEffect(() => {
        setSelectedRow(null);
    }, [datasetActiveTab, results]);

    // Get Source A timestamp for annotation line (when a row is selected in matrix mode)
    const sourceATime = useMemo(() => {
        if (results?.type === 'matrix' && selectedRow !== null && results.matrix?.rows_time) {
            return results.matrix.rows_time[selectedRow];
        }
        return undefined;
    }, [results, selectedRow]);

    // Handle chart point click → seek video to that time
    const handleChartPointClick = (timeSeconds: number, _index: number) => {
        if (videoPlayerRef.current) {
            videoPlayerRef.current.seekTo(timeSeconds);
            // Scroll the video player into view
            videoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Determine if heatmap should be visible (for triggering re-render)
    // Note: HeatmapChart controls its own rendering efficiency now.

    // Extract similarity curve for VideoPlayer overlay
    const similarityCurve = useMemo(() => {
        if (results?.type === 'curve' && results.curve) {
            return results.curve;
        }
        // Also extract curve from dataset type
        if (results?.type === 'dataset' && results.curve) {
            return results.curve;
        }
        return undefined;
    }, [results]);


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
                    <div ref={videoContainerRef} className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <VideoPlayer
                            ref={videoPlayerRef}
                            query={state.selectedQVQuery}
                            similarityCurve={similarityCurve}
                        />
                    </div>
                )}



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
                        {results.type === 'matrix' && results.matrix && (
                            <HeatmapChart
                                data={results.matrix}
                                selectedRow={selectedRow}
                                onRowSelect={setSelectedRow}
                            />
                        )}

                        {/* Line Chart with Source A context */}
                        {(results.type === 'curve' || (results.type === 'matrix' && selectedRow !== null)) && (
                            <SimilarityChart
                                results={results}
                                selectedRow={selectedRow}
                                onPointClick={handleChartPointClick}
                                sourceATime={sourceATime}
                            />
                        )}

                        {/* Dataset Tabbed View (Matrix + Curve) */}
                        {results.type === 'dataset' && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                {/* Tab Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex p-1 bg-gray-100 rounded-lg">
                                        <button
                                            onClick={() => setDatasetActiveTab('curve')}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${datasetActiveTab === 'curve'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <BarChart3 size={16} />
                                            Text-to-Video Curve
                                        </button>
                                        <button
                                            onClick={() => setDatasetActiveTab('matrix')}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${datasetActiveTab === 'matrix'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Grid size={16} />
                                            Self-Similarity Matrix
                                        </button>
                                    </div>

                                    {/* Copy Button (only show for curve tab) */}
                                    {datasetActiveTab === 'curve' && results.curve && (
                                        <button
                                            onClick={handleCopySimilarityValues}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${isCopied
                                                    ? 'bg-green-50 text-green-600 border-green-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            title="Copy similarity values to clipboard"
                                        >
                                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                                            {isCopied ? 'Copied!' : 'Copy'}
                                        </button>
                                    )}
                                </div>

                                {/* Curve Tab Content */}
                                {datasetActiveTab === 'curve' && results.curve && (
                                    <div className="animate-in fade-in duration-200">
                                        <SimilarityChart
                                            results={results}
                                            selectedRow={null}
                                            onPointClick={handleChartPointClick}
                                            relevantWindows={state.selectedQVQuery?.relevant_windows}
                                            variant='plain'
                                        />
                                    </div>
                                )}

                                {/* Matrix Tab Content */}
                                {datasetActiveTab === 'matrix' && results.matrix && (
                                    <div className="animate-in fade-in duration-200 space-y-6">
                                        <HeatmapChart
                                            data={results.matrix}
                                            variant="plain"
                                            selectedRow={selectedRow}
                                            onRowSelect={setSelectedRow}
                                        />

                                        {/* Detailed Curve for Selected Row */}
                                        {selectedRow !== null && (
                                            <div className="animate-in slide-in-from-top-4 duration-300 pt-4 border-t border-gray-100">
                                                <SimilarityChart
                                                    results={results}
                                                    selectedRow={selectedRow}
                                                    onPointClick={handleChartPointClick}
                                                    sourceATime={results.matrix.rows_time[selectedRow]}
                                                    variant="plain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
