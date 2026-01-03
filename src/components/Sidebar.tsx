import { useRef } from 'react';
import { Settings, ChevronDown, UploadCloud, X, Video, Dice5, Download, Zap, Cpu, CheckCircle2, AlertCircle, MoreHorizontal } from 'lucide-react';
import { SourceType, AppState, TextEmbedType } from '../hooks/useAppState';

interface SidebarProps {
    state: AppState & {
        setTab: (t: any) => void;
        setSourceAType: (t: SourceType) => void;
        setSourceBType: (t: SourceType) => void;
        setSourceAText: (t: string) => void;
        setSourceBText: (t: string) => void;
        setSourceAFile: (f: File | null) => void;
        setSourceBFile: (f: File | null) => void;
        setModelPreset: (s: string) => void;
        setCustomModelId: (s: string) => void;
        setUseGpu: (b: boolean) => void;
        setReparamSigma: (n: number) => void;
        setTextEmbedType: (t: TextEmbedType) => void;
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
        textEmbedType, setTextEmbedType
    } = state;

    const fileInputARef = useRef<HTMLInputElement>(null);
    const fileInputBRef = useRef<HTMLInputElement>(null);

    const handleFileDrop = (e: React.DragEvent, target: 'A' | 'B', expectedType: SourceType) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const setter = target === 'A' ? setSourceAFile : setSourceBFile;

            if (expectedType === 'Image' && file.type.startsWith('image/')) setter(file);
            if (expectedType === 'Video' && file.type.startsWith('video/')) setter(file);
        }
    };

    const renderSourceSection = (
        label: string,
        type: SourceType,
        setType: (t: SourceType) => void,
        textVal: string,
        setTextVal: (s: string) => void,
        fileVal: File | null,
        setFileVal: (f: File | null) => void,
        inputRef: any,
        target: 'A' | 'B'
    ) => {
        return (
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">{label} Type</label>
                <div className="relative">
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as SourceType)}
                        className="w-full appearance-none px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-8"
                    >
                        <option value="Image">Image</option>
                        <option value="Video">Video</option>
                        <option value="Text">Text</option>
                        <option value="Random">Random Vector</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>

                {/* Content Input */}
                <div className="pt-2">
                    {type === 'Text' && (
                        <textarea
                            value={textVal}
                            onChange={(e) => setTextVal(e.target.value)}
                            placeholder={`Enter text for ${label}...`}
                            className="w-full h-32 p-3 bg-white border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm"
                        />
                    )}

                    {(type === 'Image' || type === 'Video') && (
                        <div>
                            {!fileVal ? (
                                <div
                                    onClick={() => inputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleFileDrop(e, target, type)}
                                    className="border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group hover:border-black bg-gray-50 hover:bg-gray-100 cursor-pointer"
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
                                    <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-600">
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                            {type === 'Image' ? <UploadCloud size={20} /> : <Video size={20} />}
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-xs font-medium text-gray-900">Upload {type}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative border-2 border-gray-200 bg-gray-50 rounded-xl h-32 flex items-center justify-center overflow-hidden">
                                    {type === 'Image' ? (
                                        <img src={URL.createObjectURL(fileVal)} className="w-full h-full object-contain p-2" alt="Preview" />
                                    ) : (
                                        <video src={URL.createObjectURL(fileVal)} className="w-full h-full object-contain p-2" />
                                    )}
                                    <button
                                        onClick={() => setFileVal(null)}
                                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'Random' && (
                        <div className="h-32 bg-slate-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-slate-400">
                            <Dice5 size={24} className="opacity-50 mb-2" />
                            <p className="text-xs font-medium uppercase tracking-wider">Random Vector</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full border-r border-gray-200 z-10 shadow-lg md:shadow-none bg-gray-50 flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-black text-white rounded-lg">
                    <Settings data-testid="settings-icon" size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">VLM Scorer</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6">
                <button
                    onClick={() => setTab('general')}
                    className={`flex - 1 px - 3 py - 1.5 text - sm font - medium rounded - md transition - all ${tab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'} `}
                >
                    General
                </button>
                <button
                    onClick={() => setTab('source')}
                    className={`flex - 1 px - 3 py - 1.5 text - sm font - medium rounded - md transition - all ${tab === 'source' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'} `}
                >
                    Source
                </button>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto">
                {/* Source Settings */}
                {tab === 'source' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                        {renderSourceSection("Source A", sourceAType, setSourceAType, sourceAText, setSourceAText, sourceAFile, setSourceAFile, fileInputARef, 'A')}

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-300 text-xs uppercase font-semibold">VS</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {renderSourceSection("Source B", sourceBType, setSourceBType, sourceBText, setSourceBText, sourceBFile, setSourceBFile, fileInputBRef, 'B')}
                    </div>
                )}

                {/* General Settings */}
                {tab === 'general' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Model Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-700 block mb-1">Select Model</label>
                            <div className="relative">
                                <select
                                    value={modelPreset}
                                    onChange={(e) => setModelPreset(e.target.value)}
                                    className="w-full appearance-none px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-8"
                                >
                                    <option value="openai/clip-vit-large-patch14">OpenAI CLIP ViT-Large Patch14</option>
                                    <option value="Xenova/clip-vit-base-patch32">CLIP ViT-Base Patch32</option>
                                    <option value="custom">Custom (Hugging Face ID)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>

                            {modelPreset === 'custom' && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Custom Repo ID</label>
                                    <input
                                        type="text"
                                        value={customModelId}
                                        onChange={(e) => setCustomModelId(e.target.value)}
                                        placeholder="google/siglip-so400m-patch14-384"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                    />
                                </div>
                            )}

                            <button
                                onClick={onLoadModel}
                                disabled={modelStatus === 'loading'}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all bg-black text-white hover:bg-gray-800 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {modelStatus === 'loading' ? (
                                    <span>Loading...</span>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>Load Model</span>
                                    </>
                                )}
                            </button>

                            {/* Status */}
                            <div className="min-h-[40px]">
                                {modelStatus === 'loading' && (
                                    <div className="text-xs text-gray-600 animate-pulse">Loading Model...</div>
                                )}
                                {modelStatus === 'ready' && (
                                    <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-2 rounded-md border border-green-100 fade-in">
                                        <CheckCircle2 size={16} />
                                        <span>Model loaded.</span>
                                    </div>
                                )}
                                {modelStatus === 'error' && (
                                    <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 p-2 rounded-md border border-red-100 fade-in">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span className="leading-snug break-words">{modelStatusMsg || "Error"}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-200"></div>

                        {/* Analysis Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <MoreHorizontal size={16} />
                                Analysis Settings
                            </h3>

                            {/* Text Embed Type */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 block mb-1">Text Embedding Strategy</label>
                                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-md">
                                    <button
                                        onClick={() => setTextEmbedType('projected')}
                                        className={`flex - 1 text - xs py - 1.5 rounded transition - all ${textEmbedType === 'projected' ? 'bg-white shadow-sm font-medium text-black' : 'text-gray-500 hover:text-gray-700'} `}
                                    >
                                        Projected
                                    </button>
                                    <button
                                        onClick={() => setTextEmbedType('pooler_output')}
                                        className={`flex - 1 text - xs py - 1.5 rounded transition - all ${textEmbedType === 'pooler_output' ? 'bg-white shadow-sm font-medium text-black' : 'text-gray-500 hover:text-gray-700'} `}
                                    >
                                        Pooler Output
                                    </button>
                                </div>
                            </div>

                            {/* Reparameterization */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-500">Reparameterization Sigma</label>
                                    <span className="text-xs font-mono bg-gray-100 px-1 rounded">{reparamSigma.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={reparamSigma}
                                    onChange={(e) => setReparamSigma(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                />
                                <p className="text-[10px] text-gray-400">Add noise to embeddings to test robustness.</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200"></div>

                        {/* GPU Setting */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p - 2 rounded - md transition - colors ${useGpu ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'} `}>
                                    {useGpu ? <Zap size={18} /> : <Cpu size={18} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">GPU Mode</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setUseGpu(!useGpu)}
                                className={`relative inline - flex h - 5 w - 9 flex - shrink - 0 cursor - pointer rounded - full border - 2 border - transparent transition - colors duration - 200 ease -in -out focus: outline - none ${useGpu ? 'bg-black' : 'bg-gray-200'} `}
                            >
                                <span className={`pointer - events - none inline - block h - 4 w - 4 transform rounded - full bg - white shadow ring - 0 transition duration - 200 ease -in -out ${useGpu ? 'translate-x-4' : 'translate-x-0'} `}></span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-xs text-center text-gray-300 mt-auto pt-4 border-t border-gray-200">
                v2.0 Generic Source Update
            </div>
        </div>
    );
}
