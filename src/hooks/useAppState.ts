import { useState } from 'react';

export type SourceType = 'Image' | 'Video' | 'Text' | 'Random';
export type Tab = 'source' | 'general';
export type TextEmbedType = 'projected' | 'pooler_output';
export type VideoSubMode = 'Local' | 'QVHighlights';

// Server file reference for files stored on the server
export interface ServerFileRef {
    type: 'server';
    path: string;
    name: string;
}

// Union type for file sources - can be local File, server reference, or null
export type FileSource = File | ServerFileRef | null;

// Helper type for source-aware state setters
export type SourceTypeWithClear = (t: SourceType) => void;

// QVHighlights query data
export interface QVHighlightsQuery {
    qid: number;
    query: string;
    vid: string;
    duration: number;
    relevant_windows: number[][];
}

export interface AppState {
    tab: Tab;
    sourceAType: SourceType;
    sourceBType: SourceType;
    sourceAText: string;
    sourceBText: string;
    sourceAFile: FileSource;
    sourceBFile: FileSource;

    // Model & Settings
    modelPreset: string;
    customModelId: string;
    useGpu: boolean;
    reparamSigma: number;
    useReparamA: boolean;
    useReparamB: boolean;
    textEmbedTypeA: TextEmbedType;
    textEmbedTypeB: TextEmbedType;
    videoFps: number;

    // QVHighlights
    videoSubMode: VideoSubMode;
    selectedQVQuery: QVHighlightsQuery | null;
    datasetPath: string;
    videoPath: string;
}

export function useAppState() {
    const [tab, setTab] = useState<Tab>('source');

    const [sourceAType, setSourceATypeInternal] = useState<SourceType>('Video'); // Default A
    const [sourceBType, setSourceBTypeInternal] = useState<SourceType>('Text');  // Default B

    const [sourceAText, setSourceAText] = useState<string>('');
    const [sourceBText, setSourceBText] = useState<string>('');

    const [sourceAFile, setSourceAFile] = useState<FileSource>(null);
    const [sourceBFile, setSourceBFile] = useState<FileSource>(null);

    const [modelPreset, setModelPreset] = useState<string>('Xenova/clip-vit-base-patch32');
    const [customModelId, setCustomModelId] = useState<string>('');
    const [useGpu, setUseGpu] = useState<boolean>(true);

    const [reparamSigma, setReparamSigma] = useState<number>(0.0);
    const [useReparamA, setUseReparamA] = useState<boolean>(false);
    const [useReparamB, setUseReparamB] = useState<boolean>(false);
    const [textEmbedTypeA, setTextEmbedTypeA] = useState<TextEmbedType>('projected');
    const [textEmbedTypeB, setTextEmbedTypeB] = useState<TextEmbedType>('projected');
    const [videoFps, setVideoFps] = useState<number>(1);

    // QVHighlights state
    const [videoSubMode, setVideoSubMode] = useState<VideoSubMode>('Local');
    const [selectedQVQuery, setSelectedQVQuery] = useState<QVHighlightsQuery | null>(null);
    const [datasetPath, setDatasetPath] = useState<string>('/data1/zhaofanghan/vmr_dataset/data/qvhighlights');
    const [videoPath, setVideoPath] = useState<string>('/data1/zhaofanghan/vmr_dataset/qvhilights_videos');

    // Wrapper setters that clear content when source type changes
    const setSourceAType = (newType: SourceType) => {
        if (newType !== sourceAType) {
            setSourceAFile(null);
            setSourceAText('');
        }
        setSourceATypeInternal(newType);
    };

    const setSourceBType = (newType: SourceType) => {
        if (newType !== sourceBType) {
            setSourceBFile(null);
            setSourceBText('');
        }
        setSourceBTypeInternal(newType);
    };

    return {
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
    };
}

/**
 * Helper function to check if sources are ready for calculation.
 * Moved from MainContent.tsx for better separation of concerns.
 */
export function isSourceReady(state: AppState): boolean {
    const { sourceAType, sourceBType, sourceAText, sourceBText, sourceAFile, sourceBFile } = state;

    // Helper to check if a file source is valid
    const isFileSourceValid = (file: FileSource): boolean => {
        if (!file) return false;
        if (file instanceof File) return true;
        if ('type' in file && file.type === 'server') return true;
        return false;
    };

    return (
        (sourceAType !== 'Text' || sourceAText.length > 0) &&
        (sourceBType !== 'Text' || sourceBText.length > 0) &&
        (sourceAType !== 'Image' && sourceAType !== 'Video' || isFileSourceValid(sourceAFile)) &&
        (sourceBType !== 'Image' && sourceBType !== 'Video' || isFileSourceValid(sourceBFile))
    );
}
