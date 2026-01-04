import { useRef, useState } from 'react';
import { Settings, ChevronDown, UploadCloud, X, Video, Dice5, Download, Zap, Cpu, CheckCircle2, AlertCircle, Server, HardDrive, Film, Database, Save, Loader2 } from 'lucide-react';
import { SourceType, AppState, TextEmbedType, FileSource, ServerFileRef, VideoSubMode, QVHighlightsQuery } from '../hooks/useAppState';
import ServerFilePicker from './ServerFilePicker';
import QVHighlightsQueryPicker from './QVHighlightsQueryPicker';
import { ServerVideoFile } from '../hooks/useServerVideos';
import { useSettings } from '../hooks/useSettings';

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
        setVideoSubMode: (m: VideoSubMode) => void;
        setSelectedQVQuery: (q: QVHighlightsQuery | null) => void;
        setDatasetPath: (p: string) => void;
        setVideoPath: (p: string) => void;
    };
    onLoadModel: () => void;
    modelStatus: 'idle' | 'loading' | 'ready' | 'error';
    modelStatusMsg?: string;
}

export default function Sidebar({ state, onLoadModel, modelStatus, modelStatusMsg }: SidebarProps) {
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
        videoSubMode, setVideoSubMode,
        selectedQVQuery, setSelectedQVQuery,
        datasetPath, setDatasetPath,
        videoPath, setVideoPath
    } = state;

    const fileInputARef = useRef<HTMLInputElement>(null);
    const fileInputBRef = useRef<HTMLInputElement>(null);

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

    const handleFileDrop = (
        e: React.DragEvent,
        setType: (t: SourceType) => void,
        setFile: (f: File | null) => void
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];

            if (file.type.startsWith('image/')) {
                setType('Image');
                setFile(file);
            } else if (file.type.startsWith('video/')) {
                setType('Video');
                setFile(file);
            }
        }
    };

    const renderSourceSection = (
        label: string,
        type: SourceType,
        setType: (t: SourceType) => void,
        textVal: string,
        setTextVal: (s: string) => void,
        fileVal: FileSource,
        setFileVal: (f: FileSource) => void,
        inputRef: any,
        target: 'A' | 'B',
        useReparam: boolean,
        setUseReparam: (b: boolean) => void,
        textEmbedTypeLocal: TextEmbedType,
        setTextEmbedTypeLocal: (t: TextEmbedType) => void
    ) => {
        return (
            <div
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md relative group/section"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={(e) => handleFileDrop(e, setType, setFileVal)}
            >


                <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
                    <div className="flex items-center gap-2">
                        {/* Reparam Toggle */}
                        <button
                            onClick={() => setUseReparam(!useReparam)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${useReparam ? 'bg-black text-white border-black' : 'bg-transparent text-gray-400 border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {useReparam ? 'Noise On' : 'Noise Off'}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 relative z-10">
                    <div className="relative">
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as SourceType)}
                            className="w-full appearance-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all pr-8 font-medium"
                        >
                            <option value="Image">Image</option>
                            <option value="Video">Video</option>
                            <option value="Text">Text</option>
                            <option value="Random">Random Vector</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>

                    {/* Content Input */}
                    <div>
                        {type === 'Text' && (
                            <textarea
                                value={textVal}
                                onChange={(e) => setTextVal(e.target.value)}
                                placeholder={`Enter text...`}
                                className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-gray-400 text-sm leading-relaxed"
                            />
                        )}

                        {(type === 'Image' || type === 'Video') && (() => {
                            const videoMode = target === 'A' ? videoModeA : videoModeB;
                            const setVideoMode = target === 'A' ? setVideoModeA : setVideoModeB;
                            const isServerFile = fileVal && 'type' in fileVal && fileVal.type === 'server';
                            const isLocalFile = fileVal instanceof File;

                            return (
                                <div className="space-y-2">
                                    {/* Video Sub-Mode Toggle (Local/QVHighlights) - only for Video and Target A */}
                                    {type === 'Video' && target === 'A' && (
                                        <div className="flex p-0.5 bg-gray-100 rounded-lg mb-2">
                                            <button
                                                onClick={() => {
                                                    setVideoSubMode('Local');
                                                    setSelectedQVQuery(null);
                                                    setSourceAFile(null);
                                                    setSourceBFile(null);
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${videoSubMode === 'Local'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <HardDrive size={12} />
                                                Local
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setVideoSubMode('QVHighlights');
                                                    setSourceAFile(null);
                                                    setSourceBFile(null);
                                                }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${videoSubMode === 'QVHighlights'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <Database size={12} />
                                                QVHighlights
                                            </button>
                                        </div>
                                    )}

                                    {/* Local/Server toggle for Video type (only in Local sub-mode) */}
                                    {type === 'Video' && videoSubMode === 'Local' && (
                                        <div className="flex p-0.5 bg-gray-100 rounded-lg">
                                            <button
                                                onClick={() => { setVideoMode('local'); setFileVal(null); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${videoMode === 'local'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <HardDrive size={12} />
                                                Upload
                                            </button>
                                            <button
                                                onClick={() => { setVideoMode('server'); setFileVal(null); }}
                                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${videoMode === 'server'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                <Server size={12} />
                                                Server
                                            </button>
                                        </div>
                                    )}

                                    {/* QVHighlights mode - show query selection */}
                                    {type === 'Video' && videoSubMode === 'QVHighlights' && target === 'A' && (
                                        <>
                                            {!selectedQVQuery ? (
                                                <div
                                                    onClick={() => setQvPickerOpen(true)}
                                                    className="border-2 border-dashed border-blue-200 rounded-lg h-24 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                                                >
                                                    <div className="flex flex-col items-center gap-1 text-blue-400 group-hover:text-blue-600">
                                                        <Database size={18} />
                                                        <span className="text-xs font-medium">Select Query</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative border border-blue-200 bg-blue-50 rounded-lg p-3 group">
                                                    <p className="text-xs text-gray-700 line-clamp-2 pr-6">{selectedQVQuery.query}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1 font-mono">{selectedQVQuery.vid}</p>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedQVQuery(null); setSourceAFile(null); setSourceBFile(null); }}
                                                        className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Show selected video info for Source B when in QVHighlights mode */}
                                    {type === 'Video' && videoSubMode === 'QVHighlights' && target === 'B' && selectedQVQuery && (
                                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Linked to Source A</p>
                                            <p className="text-[10px] text-gray-700 font-mono">{selectedQVQuery.vid}</p>
                                        </div>
                                    )}

                                    {/* Regular file upload/selection area (for Local mode) */}
                                    {(type === 'Image' || (type === 'Video' && videoSubMode === 'Local')) && !fileVal ? (
                                        <div
                                            onClick={() => {
                                                if (type === 'Video' && videoMode === 'server') {
                                                    setPickerTarget(target);
                                                } else {
                                                    inputRef.current?.click();
                                                }
                                            }}
                                            className="border-2 border-dashed border-gray-200 rounded-lg h-24 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group hover:border-black/20 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <input
                                                type="file"
                                                ref={inputRef}
                                                className="hidden"
                                                accept={type === 'Image' ? "image/*" : "video/*"}
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setFileVal(e.target.files[0]);
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-gray-600">
                                                {type === 'Video' && videoMode === 'server' ? (
                                                    <>
                                                        <Server size={18} />
                                                        <span className="text-xs font-medium">Browse Server</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {type === 'Image' ? <UploadCloud size={18} /> : <Video size={18} />}
                                                        <span className="text-xs font-medium">Upload {type}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : isServerFile ? (
                                        /* Server file selected */
                                        <div className="relative border border-gray-200 bg-gray-50 rounded-lg h-24 flex items-center justify-center overflow-hidden group">
                                            <div className="flex flex-col items-center gap-2 text-gray-600 px-4">
                                                <Film size={24} className="text-gray-400" />
                                                <span className="text-xs font-medium text-center truncate max-w-full">
                                                    {(fileVal as ServerFileRef).name}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFileVal(null); }}
                                                className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : isLocalFile ? (
                                        /* Local file selected */
                                        <div className="relative border border-gray-200 bg-gray-50 rounded-lg h-24 flex items-center justify-center overflow-hidden group">
                                            {type === 'Image' ? (
                                                <img src={URL.createObjectURL(fileVal as File)} className="w-full h-full object-contain" alt="Preview" />
                                            ) : (
                                                <video src={URL.createObjectURL(fileVal as File)} className="w-full h-full object-contain" />
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFileVal(null); }}
                                                className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })()}

                        {type === 'Random' && (
                            <div className="h-24 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                <Dice5 size={20} className="opacity-40 mb-1" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Random Vector</span>
                            </div>
                        )}
                    </div>

                    {/* Text Strategy (inline, only when type is Text) */}
                    {type === 'Text' && (
                        <div className="pt-1">
                            <span className="text-[10px] font-semibold text-gray-500 block mb-2">Text Strategy</span>
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`textStrategy-${target}`}
                                        value="projected"
                                        checked={textEmbedTypeLocal === 'projected'}
                                        onChange={() => setTextEmbedTypeLocal('projected')}
                                        className="sr-only"
                                    />
                                    <div className={`py-1.5 rounded-md text-xs font-medium border text-center transition-all ${textEmbedTypeLocal === 'projected'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}>
                                        Projected
                                    </div>
                                </label>
                                <label className="flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`textStrategy-${target}`}
                                        value="pooler_output"
                                        checked={textEmbedTypeLocal === 'pooler_output'}
                                        onChange={() => setTextEmbedTypeLocal('pooler_output')}
                                        className="sr-only"
                                    />
                                    <div className={`py-1.5 rounded-md text-xs font-medium border text-center transition-all ${textEmbedTypeLocal === 'pooler_output'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}>
                                        Pooler
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const sidebarContent = (
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full min-h-0 border-r border-gray-200 z-10 shadow-sm bg-[#fafafa] flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/10 ring-1 ring-black/5">
                        <Settings data-testid="settings-icon" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">VLM Scorer</h1>
                        <span className="text-[10px] font-medium text-gray-500 tracking-wide uppercase">Control Panel</span>
                    </div>
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
                        {renderSourceSection("Source A", sourceAType, setSourceAType, sourceAText, setSourceAText, sourceAFile, setSourceAFile, fileInputARef, 'A', useReparamA, setUseReparamA, textEmbedTypeA, setTextEmbedTypeA)}

                        <div className="relative flex items-center py-2">
                            <div className="w-full border-t border-gray-200"></div>
                            <span className="absolute left-1/2 -translate-x-1/2 bg-[#fafafa] px-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">VS</span>
                        </div>

                        {renderSourceSection("Source B", sourceBType, setSourceBType, sourceBText, setSourceBText, sourceBFile, setSourceBFile, fileInputBRef, 'B', useReparamB, setUseReparamB, textEmbedTypeB, setTextEmbedTypeB)}

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
                                    {videoFps} FPS
                                </div>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                step="1"
                                value={videoFps}
                                onChange={(e) => setVideoFps(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-black hover:accent-gray-800"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>1 FPS</span>
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
        // Auto-populate both sources with the same video
        const serverRef: ServerFileRef = {
            type: 'server',
            path: query.vid,
            name: `${query.vid}.mp4`
        };
        setSourceAType('Video');
        setSourceBType('Video');
        setSourceAFile(serverRef);
        setSourceBFile(serverRef);
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
