import { useRef } from 'react';
import { Settings, ChevronDown, UploadCloud, X, Video, Dice5, Download, Zap, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

interface SidebarProps {
    state: any; // Using any for brevity in this prompt, ideally AppState & Actions
    onLoadModel: () => void;
    modelStatus: 'idle' | 'loading' | 'ready' | 'error';
    modelStatusMsg?: string;
}

export default function Sidebar({ state, onLoadModel, modelStatus, modelStatusMsg }: SidebarProps) {
    const {
        tab, setTab,
        imageSource, setImageSource,
        textSource, setTextSource,
        modelPreset, setModelPreset,
        customModelId, setCustomModelId,
        useGpu, setUseGpu,
        selectedImage, setSelectedImage,
        selectedVideo, setSelectedVideo,
        textInput, setTextInput
    } = state;

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleImageDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) setSelectedImage(file);
        }
    };

    const handleVideoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('video/')) setSelectedVideo(file);
        }
    };

    return (
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full border-r border-gray-200 z-10 shadow-lg md:shadow-none bg-gray-50 flex flex-col p-6">

            {/* Header */}
            <div className="flex items-center gap-2 mb-8">
                <div className="p-2 bg-black text-white rounded-lg">
                    <Settings data-testid="settings-icon" size={20} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">VLM Scorer</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6">
                <button
                    onClick={() => setTab('general')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${tab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    General
                </button>
                <button
                    onClick={() => setTab('source')}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${tab === 'source' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Source
                </button>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto">
                {/* Source Settings */}
                {tab === 'source' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Image Source */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Image Source</label>
                            <div className="relative">
                                <select
                                    value={imageSource}
                                    onChange={(e) => setImageSource(e.target.value)}
                                    className="w-full appearance-none px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-8"
                                >
                                    <option value="Image">Upload Image</option>
                                    <option value="Video">Upload Video</option>
                                    <option value="Random">Random Vector</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>

                            {/* Image Drop Zone */}
                            {imageSource === 'Image' && (
                                <div className="pt-2">
                                    {!selectedImage ? (
                                        <div
                                            onClick={() => imageInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleImageDrop}
                                            className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group hover:border-black bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <input
                                                type="file"
                                                ref={imageInputRef}
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/jpg"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-600">
                                                <div className="p-3 bg-white rounded-full shadow-sm">
                                                    <UploadCloud size={24} />
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="text-xs font-medium text-gray-900">Click to upload</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative border-2 border-gray-200 bg-gray-50 rounded-xl h-48 flex items-center justify-center overflow-hidden">
                                            <img src={URL.createObjectURL(selectedImage)} className="w-full h-full object-contain p-2" alt="Preview" />
                                            <button
                                                onClick={() => setSelectedImage(null)}
                                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Video Drop Zone */}
                            {imageSource === 'Video' && (
                                <div className="pt-2">
                                    {!selectedVideo ? (
                                        <div
                                            onClick={() => videoInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleVideoDrop}
                                            className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group hover:border-black bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                        >
                                            <input
                                                type="file"
                                                ref={videoInputRef}
                                                className="hidden"
                                                accept="video/mp4, video/webm, video/ogg"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) setSelectedVideo(e.target.files[0]);
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-gray-600">
                                                <div className="p-3 bg-white rounded-full shadow-sm">
                                                    <Video size={24} />
                                                </div>
                                                <div className="text-center px-4">
                                                    <p className="text-xs font-medium text-gray-900">Click to upload video</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative border-2 border-gray-200 bg-gray-50 rounded-xl h-48 flex items-center justify-center overflow-hidden">
                                            <video src={URL.createObjectURL(selectedVideo)} controls className="w-full h-full object-contain p-2" />
                                            <button
                                                onClick={() => setSelectedVideo(null)}
                                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-gray-500 hover:text-red-500"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {imageSource === 'Random' && (
                                <div className="h-48 bg-slate-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-slate-400 mt-2">
                                    <Dice5 size={32} className="opacity-50 mb-2" />
                                    <p className="text-xs font-medium uppercase tracking-wider">Random Vector</p>
                                </div>
                            )}
                        </div>

                        {/* Text Source */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Text Source</label>
                            <div className="relative">
                                <select
                                    value={textSource}
                                    onChange={(e) => setTextSource(e.target.value)}
                                    className="w-full appearance-none px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all pr-8"
                                >
                                    <option value="Text">Text Prompt</option>
                                    <option value="Random">Random Vector</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>

                            {textSource === 'Text' ? (
                                <div className="pt-2">
                                    <textarea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Enter description..."
                                        className="w-full h-40 p-3 bg-white border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="h-40 bg-slate-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center text-slate-400 mt-2">
                                    <Dice5 size={32} className="opacity-50 mb-2" />
                                    <p className="text-xs font-medium uppercase tracking-wider">Random Vector</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* General Settings */}
                {tab === 'general' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                            <div className="min-h-[60px]">
                                {modelStatus === 'loading' && (
                                    <div className="space-y-2 animate-pulse">
                                        <div className="text-xs text-gray-600">Loading Model...</div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-black h-full w-2/3 animate-[shimmer_1s_infinite]"></div>
                                        </div>
                                    </div>
                                )}
                                {modelStatus === 'ready' && (
                                    <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-md border border-green-100 fade-in">
                                        <CheckCircle2 size={16} />
                                        <span>Model loaded & ready.</span>
                                    </div>
                                )}
                                {modelStatus === 'error' && (
                                    <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-md border border-red-100 fade-in">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        <span className="leading-snug break-words">{modelStatusMsg || "Error"}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-200"></div>

                        {/* GPU Setting */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md transition-colors ${useGpu ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {useGpu ? <Zap size={18} /> : <Cpu size={18} />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">GPU Acceleration</span>
                                        <span className="text-xs text-gray-500">{useGpu ? 'Server GPU (CUDA)' : 'CPU Mode'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUseGpu(!useGpu)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useGpu ? 'bg-black' : 'bg-gray-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useGpu ? 'translate-x-5' : 'translate-x-0'}`}></span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-400 mt-auto pt-4 border-t border-gray-200">
                Powered by FastAPI & Transformers
            </div>
        </div>
    );
}
