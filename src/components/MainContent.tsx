import { useRef, useState, useMemo, useEffect } from 'react';
import { BarChart3, Clock, Grid, Activity, Play } from 'lucide-react';
import { toast } from 'sonner';
import { AppState } from '../hooks/useAppState';
import HeatmapChart from './HeatmapChart';
import SimilarityChart from './SimilarityChart';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';
import { ALGORITHMS, AlgorithmId, applyAlgorithm } from '../utils/postProcessing';
import { useSegmentMatrices } from '../hooks/useSegmentMatrices';
import { BoxSelect, GitFork } from 'lucide-react';

import { AnalysisResults, FrameResult } from '../types';

interface MainContentProps {
    state: AppState;
    results: AnalysisResults | null;
}

export default function MainContent({ state, results }: MainContentProps) {
    const videoPlayerRef = useRef<VideoPlayerHandle>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [datasetActiveTab, setDatasetActiveTab] = useState<'matrix' | 'curve' | 'cross-sim' | 'giou'>('curve');

    // Zoom state (time range in seconds)
    const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(null);

    const [isCopied, setIsCopied] = useState(false);

    // Post-processing state
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmId>('raw');
    const [processedCurve, setProcessedCurve] = useState<FrameResult[] | null>(null);

    // Reset processed curve when results change
    useEffect(() => {
        setProcessedCurve(null);
        setSelectedAlgorithm('raw');
    }, [results]);

    // Apply post-processing algorithm
    const handleApplyAlgorithm = () => {
        if (!results?.curve || results.curve.length === 0) {
            toast.error('No curve data to process');
            return;
        }
        const processed = applyAlgorithm(selectedAlgorithm, results.curve);
        setProcessedCurve(processed);
        toast.success(`Applied ${ALGORITHMS.find(a => a.id === selectedAlgorithm)?.label} algorithm`);
    };

    // Get the curve data to display (processed or original)
    const displayCurve = useMemo(() => {
        return processedCurve ?? results?.curve ?? null;
    }, [processedCurve, results?.curve]);

    const { crossSim, giou } = useSegmentMatrices(displayCurve, state.selectedQVQuery?.relevant_windows);

    // Handle copy similarity values to clipboard
    const handleCopySimilarityValues = () => {
        console.log('Copy button clicked', { results });

        const curve = displayCurve;
        if (!curve || curve.length === 0) {
            toast.error('No similarity data to copy');
            return;
        }

        const lines = curve.map((frame) => {
            return `${frame.time.toFixed(1)}s\t${frame.score.toFixed(6)}`;
        });

        const header = 'Time\tSimilarity Score';
        const text = [header, ...lines].join('\n');

        // Use Clipboard API if available, otherwise fallback to execCommand
        const copyToClipboard = async (content: string) => {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(content);
            } else {
                // Fallback for non-HTTPS environments
                const textArea = document.createElement('textarea');
                textArea.value = content;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
        };

        copyToClipboard(text).then(() => {
            setIsCopied(true);
            toast.success('Similarity values copied to clipboard');
            setTimeout(() => setIsCopied(false), 2000);
        }).catch((err) => {
            console.error('Copy failed:', err);
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
                                zoomRange={zoomRange}
                                onZoom={setZoomRange}
                            />
                        )}

                        {/* Dataset Tabbed View (Matrix + Curve) */}
                        {results.type === 'dataset' && (
                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                {/* Tab Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto">
                                        <button
                                            onClick={() => setDatasetActiveTab('curve')}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${datasetActiveTab === 'curve'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <BarChart3 size={16} />
                                            Text-to-Video Curve
                                        </button>
                                        <button
                                            onClick={() => setDatasetActiveTab('matrix')}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${datasetActiveTab === 'matrix'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Grid size={16} />
                                            Self-Similarity
                                        </button>
                                        <button
                                            onClick={() => setDatasetActiveTab('cross-sim')}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${datasetActiveTab === 'cross-sim'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <GitFork size={16} />
                                            Cross-Similarity
                                        </button>
                                        <button
                                            onClick={() => setDatasetActiveTab('giou')}
                                            disabled={!giou}
                                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${datasetActiveTab === 'giou'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                } ${!giou ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={!giou ? "No Ground Truth segments available" : ""}
                                        >
                                            <BoxSelect size={16} />
                                            GIoU Matrix
                                        </button>
                                    </div>

                                    {/* Post-Processing Algorithm Selector (only show for curve tab) */}
                                    {datasetActiveTab === 'curve' && results.curve && (
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={selectedAlgorithm}
                                                onChange={(e) => setSelectedAlgorithm(e.target.value as AlgorithmId)}
                                                className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            >
                                                {ALGORITHMS.map((algo) => (
                                                    <option key={algo.id} value={algo.id}>
                                                        {algo.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleApplyAlgorithm}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
                                                title="Apply post-processing algorithm"
                                            >
                                                <Play size={14} />
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Curve Tab Content */}
                                {datasetActiveTab === 'curve' && results.curve && (
                                    <div className="animate-in fade-in duration-200">
                                        <SimilarityChart
                                            results={displayCurve ? { ...results, curve: displayCurve } : results}
                                            selectedRow={null}
                                            onPointClick={handleChartPointClick}
                                            relevantWindows={state.selectedQVQuery?.relevant_windows}
                                            variant='plain'
                                            showCopyButton={true}
                                            isCopied={isCopied}
                                            onCopy={handleCopySimilarityValues}
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
                                            zoomRange={zoomRange}
                                            onZoom={setZoomRange}
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
                                                    zoomRange={zoomRange}
                                                    onZoom={setZoomRange}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cross-Similarity Tab Content */}
                                {datasetActiveTab === 'cross-sim' && crossSim && (
                                    <div className="animate-in fade-in duration-200 space-y-6">
                                        <HeatmapChart
                                            data={crossSim}
                                            variant="plain"
                                            selectedRow={selectedRow}
                                            onRowSelect={setSelectedRow}
                                            zoomRange={zoomRange}
                                            onZoom={setZoomRange}
                                        />
                                        <p className="text-sm text-gray-500 text-center">
                                            Row: Start Frame, Col: End Frame. Value: Average Text-Video Similarity.
                                        </p>
                                    </div>
                                )}

                                {/* GIoU Tab Content */}
                                {datasetActiveTab === 'giou' && giou && (
                                    <div className="animate-in fade-in duration-200 space-y-6">
                                        <HeatmapChart
                                            data={giou}
                                            variant="plain"
                                            selectedRow={selectedRow}
                                            onRowSelect={setSelectedRow}
                                            zoomRange={zoomRange}
                                            onZoom={setZoomRange}
                                        />
                                        <p className="text-sm text-gray-500 text-center">
                                            Row: Start Frame, Col: End Frame. Value: GIoU with Ground Truth.
                                        </p>
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
