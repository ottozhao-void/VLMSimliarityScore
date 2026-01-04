import React, { useRef } from 'react';
import { ChevronDown, UploadCloud, X, Video, Dice5, Server, HardDrive, Film, Database } from 'lucide-react';
import { SourceType, TextEmbedType, FileSource, ServerFileRef, QVHighlightsQuery } from '../hooks/useAppState';

interface SourceSectionProps {
    label: string;
    type: SourceType;
    setType: (t: SourceType) => void;
    textVal: string;
    setTextVal: (s: string) => void;
    fileVal: FileSource;
    setFileVal: (f: FileSource) => void;
    target: 'A' | 'B';
    useReparam: boolean;
    setUseReparam: (b: boolean) => void;
    textEmbedType: TextEmbedType;
    setTextEmbedType: (t: TextEmbedType) => void;
    isDisabled?: boolean;
    videoMode: 'local' | 'server';
    setVideoMode: (m: 'local' | 'server') => void;
    onServerPickerOpen: () => void;
    onQVPickerOpen: () => void;
    selectedQVQuery: QVHighlightsQuery | null;
    onClearQVQuery: () => void;
}

export default function SourceSection({
    label,
    type,
    setType,
    textVal,
    setTextVal,
    fileVal,
    setFileVal,
    target,
    useReparam,
    setUseReparam,
    textEmbedType,
    setTextEmbedType,
    isDisabled = false,
    videoMode,
    setVideoMode,
    onServerPickerOpen,
    onQVPickerOpen,
    selectedQVQuery,
    onClearQVQuery
}: SourceSectionProps) {
    const inputRef = useRef<HTMLInputElement>(null);

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

    const isServerFile = fileVal && 'type' in fileVal && fileVal.type === 'server';
    const isLocalFile = fileVal instanceof File;

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
                    {isDisabled ? (
                        <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400 font-medium flex items-center justify-between">
                            <span>Auto-controlled</span>
                            <Database size={14} className="text-blue-400" />
                        </div>
                    ) : (
                        <>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as SourceType)}
                                className="w-full appearance-none px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all pr-8 font-medium"
                            >
                                <option value="Image">Image</option>
                                <option value="Video">Video</option>
                                <option value="Text">Text</option>
                                <option value="Random">Random Vector</option>
                                <option value="DATASET:QVHighlights">DATASET: QVHighlights</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                        </>
                    )}
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

                    {(type === 'Image' || type === 'Video') && (
                        <div className="space-y-2">
                            {/* Local/Server toggle for Video type */}
                            {type === 'Video' && (
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

                            {/* File upload/selection area */}
                            {!fileVal ? (
                                <div
                                    onClick={() => {
                                        if (type === 'Video' && videoMode === 'server') {
                                            onServerPickerOpen();
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
                    )}

                    {/* DATASET:QVHighlights - Query Selection */}
                    {type === 'DATASET:QVHighlights' && (
                        <>
                            {!selectedQVQuery ? (
                                <div
                                    onClick={onQVPickerOpen}
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
                                        onClick={(e) => { e.stopPropagation(); onClearQVQuery(); }}
                                        className="absolute top-2 right-2 p-1 bg-white rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}

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
                                    checked={textEmbedType === 'projected'}
                                    onChange={() => setTextEmbedType('projected')}
                                    className="sr-only"
                                />
                                <div className={`py-1.5 rounded-md text-xs font-medium border text-center transition-all ${textEmbedType === 'projected'
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
                                    checked={textEmbedType === 'pooler_output'}
                                    onChange={() => setTextEmbedType('pooler_output')}
                                    className="sr-only"
                                />
                                <div className={`py-1.5 rounded-md text-xs font-medium border text-center transition-all ${textEmbedType === 'pooler_output'
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
}
