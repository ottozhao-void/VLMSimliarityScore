import { useState } from 'react';
import { Settings, ChevronDown, Download, Zap, Cpu, CheckCircle2, AlertCircle, Database, Save, Loader2, Play } from 'lucide-react';
import { SourceType, AppState, TextEmbedType, FileSource, ServerFileRef, QVHighlightsQuery, isSourceReady } from '../hooks/useAppState';
import ServerFilePicker from './ServerFilePicker';
import QVHighlightsQueryPicker from './QVHighlightsQueryPicker';
import { ServerVideoFile } from '../hooks/useServerVideos';
import { useSettings } from '../hooks/useSettings';
import SourceSection from './SourceSection';

interface SidebarProps {
    state: AppState & {
        setTab: (t: any) => void;
        setSourceAType: (t: SourceType) => void;
        setSourceBType: (t: SourceType) => void;
        setSourceAText: (t: string) => void;
        setSourceBText: (t: string) => void;
        setSourceAFile: (f: FileSource) => void;
        setSourceBFile: (f: FileSource) => void;
        setModelPreset: (s: string) => void;
        setCustomModelId: (s: string) => void;
        setUseGpu: (b: boolean) => void;
        setReparamSigma: (n: number) => void;
        setUseReparamA: (b: boolean) => void;
        setUseReparamB: (b: boolean) => void;
        setTextEmbedTypeA: (t: TextEmbedType) => void;
        setTextEmbedTypeB: (t: TextEmbedType) => void;
        setVideoFps: (n: number) => void;
        // QVHighlights
        setSelectedQVQuery: (q: QVHighlightsQuery | null) => void;
        setDatasetPath: (p: string) => void;
        setVideoPath: (p: string) => void;
    };
    onLoadModel: () => void;
    modelStatus: 'idle' | 'loading' | 'ready' | 'error';
    modelStatusMsg?: string;
    onCalculate: () => void;
    calculating: boolean;
}

export default function Sidebar({ state, onLoadModel, modelStatus, modelStatusMsg, onCalculate, calculating }: SidebarProps) {
    const {
        tab, setTab,
        sourceAType, setSourceAType,
        sourceBType, setSourceBType,
        sourceAText, setSourceAText,
        sourceBText, setSourceBText,
        sourceAFile, setSourceAFile,
        sourceBFile, setSourceBFile,
        modelPreset, setModelPreset,
        customModelId, setCustomModelId,
        useGpu, setUseGpu,
        reparamSigma, setReparamSigma,
        useReparamA, setUseReparamA,
        useReparamB, setUseReparamB,
        textEmbedTypeA, setTextEmbedTypeA,
        textEmbedTypeB, setTextEmbedTypeB,
        videoFps, setVideoFps,
        // QVHighlights
        selectedQVQuery, setSelectedQVQuery,
        datasetPath, setDatasetPath,
        videoPath, setVideoPath
    } = state;

    const isReady = isSourceReady(state);

    // State for server file picker modal
    const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);

    // State for QVHighlights query picker modal
    const [qvPickerOpen, setQvPickerOpen] = useState(false);

    // State for video source mode (local vs server)
    const [videoModeA, setVideoModeA] = useState<'local' | 'server'>('local');
    const [videoModeB, setVideoModeB] = useState<'local' | 'server'>('local');

    // Settings hook for path management
    const { saving, validationErrors, saveSettings } = useSettings();
    const [editDatasetPath, setEditDatasetPath] = useState(datasetPath);
    const [editVideoPath, setEditVideoPath] = useState(videoPath);





    const sidebarContent = (
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full min-h-0 border-r border-gray-200 z-10 shadow-sm bg-[#fafafa] flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-6 gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/5">
                            <Settings data-testid="settings-icon" size={20} />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">VLM Scorer</h1>
                            <span className="text-[10px] font-medium text-gray-500 tracking-wide uppercase">Control Panel</span>
                        </div>
                    </div>

                    {/* Calculate Button */}
                    <button
                        onClick={onCalculate}
                        disabled={!isReady || calculating}
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all shadow-sm ${isReady && !calculating
                            ? 'bg-black text-white hover:bg-gray-800 hover:shadow-md active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        title="Calculate Similarity (Ctrl+Shift+C)"
                    >
                        {calculating ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Play size={14} fill="currentColor" />
                                <span>Calculate</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200/60 rounded-xl">
                    <button
                        onClick={() => setTab('source')}
                        className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${tab === 'source' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Source
                    </button>
                    <button
                        onClick={() => setTab('general')}
                        className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${tab === 'general' ? 'bg-white text-black shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        General
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                {/* Source Settings */}
                {tab === 'source' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <SourceSection
                            label="Source A"
                            type={sourceAType}
                            setType={setSourceAType}
                            textVal={sourceAText}
                            setTextVal={setSourceAText}
                            fileVal={sourceAFile}
                            setFileVal={setSourceAFile}
                            target='A'
                            useReparam={useReparamA}
                            setUseReparam={setUseReparamA}
                            textEmbedType={textEmbedTypeA}
                            setTextEmbedType={setTextEmbedTypeA}
                            isDisabled={sourceBType === 'DATASET:QVHighlights'}
                            videoMode={videoModeA}
                            setVideoMode={setVideoModeA}
                            onServerPickerOpen={() => setPickerTarget('A')}
                            onQVPickerOpen={() => setQvPickerOpen(true)}
                            selectedQVQuery={selectedQVQuery}
                            onClearQVQuery={() => setSelectedQVQuery(null)}
                        />

                        <div className="relative flex items-center py-2">
                            <div className="w-full border-t border-gray-200"></div>
                            <span className="absolute left-1/2 -translate-x-1/2 bg-[#fafafa] px-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">VS</span>
                        </div>

                        <SourceSection
                            label="Source B"
                            type={sourceBType}
                            setType={setSourceBType}
                            textVal={sourceBText}
                            setTextVal={setSourceBText}
                            fileVal={sourceBFile}
                            setFileVal={setSourceBFile}
                            target='B'
                            useReparam={useReparamB}
                            setUseReparam={setUseReparamB}
                            textEmbedType={textEmbedTypeB}
                            setTextEmbedType={setTextEmbedTypeB}
                            isDisabled={sourceAType === 'DATASET:QVHighlights'}
                            videoMode={videoModeB}
                            setVideoMode={setVideoModeB}
                            onServerPickerOpen={() => setPickerTarget('B')}
                            onQVPickerOpen={() => setQvPickerOpen(true)}
                            selectedQVQuery={selectedQVQuery}
                            onClearQVQuery={() => setSelectedQVQuery(null)}
                        />

                        {/* Sigma Slider (Conditional) */}
                        {(useReparamA || useReparamB) && (
                            <div className="bg-white rounded-xl border border-gray-200 p-4 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900">Sigma Value</span>
                                        <span className="text-[10px] text-gray-400">Noise magnitude</span>
                                    </div>
                                    <div className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-md font-mono text-xs font-medium text-black">
                                        {reparamSigma.toFixed(2)}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={reparamSigma}
                                    onChange={(e) => setReparamSigma(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-black hover:accent-gray-800"
                                />
                            </div>
                        )}



                    </div>
                )}

                {/* General Settings */}
                {tab === 'general' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                        {/* Model Selection */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-900 block mb-2">Model Architecture</label>
                                <div className="relative">
                                    <select
                                        value={modelPreset}
                                        onChange={(e) => setModelPreset(e.target.value)}
                                        className="w-full appearance-none px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all pr-8 shadow-sm"
                                    >
                                        <option value="Xenova/clip-vit-base-patch32">CLIP ViT-Base Patch32</option>
                                        <option value="openai/clip-vit-large-patch14">OpenAI CLIP ViT-Large</option>
                                        <option value="custom">Custom (Hugging Face ID)</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>

                            {modelPreset === 'custom' && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs font-bold text-gray-900 block mb-2">Source ID</label>
                                    <input
                                        type="text"
                                        value={customModelId}
                                        onChange={(e) => setCustomModelId(e.target.value)}
                                        placeholder="e.g. openai/clip-vit-base-patch32"
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-mono"
                                    />
                                </div>
                            )}

                            <button
                                onClick={onLoadModel}
                                disabled={modelStatus === 'loading'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {modelStatus === 'loading' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Loading Model...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>Load Model</span>
                                    </>
                                )}
                            </button>

                            {/* Status */}
                            <div className="min-h-[44px]">
                                {modelStatus === 'ready' && (
                                    <div className="flex items-center gap-2 text-green-700 text-xs font-medium bg-green-50/50 p-3 rounded-xl border border-green-100 fade-in select-none">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span>Model loaded successfully.</span>
                                    </div>
                                )}
                                {modelStatus === 'error' && (
                                    <div className="flex items-start gap-2 text-red-700 text-xs font-medium bg-red-50/50 p-3 rounded-xl border border-red-100 fade-in break-words">
                                        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                        <span className="leading-snug">{modelStatusMsg || "Failed to load model."}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-200"></div>

                        {/* GPU Setting */}
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${useGpu ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {useGpu ? <Zap size={18} /> : <Cpu size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">GPU Acceleration</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseGpu(!useGpu)}
                                className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useGpu ? 'bg-black' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useGpu ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Video Frame Rate Setting */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">Video Frame Rate</span>
                                    <span className="text-[10px] text-gray-400">Frames per second for sampling</span>
                                </div>
                                <div className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-md font-mono text-xs font-medium text-black">
                                    {videoFps >= 1 ? `${videoFps} FPS` : `1 frame / ${(1 / videoFps).toFixed(0)}s`}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="30"
                                step="0.5"
                                value={videoFps}
                                onChange={(e) => setVideoFps(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-black hover:accent-gray-800"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>0.5 FPS</span>
                                <span>30 FPS</span>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200"></div>

                        {/* QVHighlights Path Settings */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <Database size={16} className="text-gray-500" />
                                <span className="text-sm font-bold text-gray-900">QVHighlights Paths</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Dataset Path</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editDatasetPath}
                                            onChange={(e) => setEditDatasetPath(e.target.value)}
                                            placeholder="/path/to/dataset"
                                            className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-black/10 focus:border-black/30"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 block mb-1">Video Path</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editVideoPath}
                                            onChange={(e) => setEditVideoPath(e.target.value)}
                                            placeholder="/path/to/videos"
                                            className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-900 focus:outline-none focus:ring-1 focus:ring-black/10 focus:border-black/30"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={async () => {
                                        const success = await saveSettings(editDatasetPath, editVideoPath);
                                        if (success) {
                                            setDatasetPath(editDatasetPath);
                                            setVideoPath(editVideoPath);
                                        }
                                    }}
                                    disabled={saving}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save size={14} /> Save Paths</>
                                    )}
                                </button>

                                {validationErrors.length > 0 && (
                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                        {validationErrors.map((err, i) => (
                                            <p key={i}>{err}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-[10px] items-center justify-center flex gap-1.5 text-gray-400 py-3 border-t border-gray-200">
                <span>v2.1</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>Enhanced UI</span>
            </div>
        </div>
    );

    // Handler for server file selection
    const handleServerFileSelect = (file: ServerVideoFile) => {
        const serverRef: ServerFileRef = {
            type: 'server',
            path: file.path,
            name: file.name
        };

        if (pickerTarget === 'A') {
            setSourceAFile(serverRef);
        } else if (pickerTarget === 'B') {
            setSourceBFile(serverRef);
        }
        setPickerTarget(null);
    };

    // Handler for QVHighlights query selection
    const handleQVQuerySelect = (query: QVHighlightsQuery) => {
        setSelectedQVQuery(query);
        // The DATASET:QVHighlights source type handles everything - no need to set files
    };

    return (
        <>
            {sidebarContent}

            {/* Server File Picker Modal */}
            <ServerFilePicker
                isOpen={pickerTarget !== null}
                onClose={() => setPickerTarget(null)}
                onSelect={handleServerFileSelect}
            />

            {/* QVHighlights Query Picker Modal */}
            <QVHighlightsQueryPicker
                isOpen={qvPickerOpen}
                onClose={() => setQvPickerOpen(false)}
                onSelect={handleQVQuerySelect}
            />
        </>
    );
}
