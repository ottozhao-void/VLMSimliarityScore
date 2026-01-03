import { useState } from 'react';

export type SourceType = 'Image' | 'Video' | 'Text' | 'Random';
export type Tab = 'source' | 'general';
export type TextEmbedType = 'projected' | 'pooler_output';

// Helper type for source-aware state setters
export type SourceTypeWithClear = (t: SourceType) => void;

export interface AppState {
    tab: Tab;
    sourceAType: SourceType;
    sourceBType: SourceType;
    sourceAText: string;
    sourceBText: string;
    sourceAFile: File | null;
    sourceBFile: File | null;

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
}

export function useAppState() {
    const [tab, setTab] = useState<Tab>('source');

    const [sourceAType, setSourceATypeInternal] = useState<SourceType>('Video'); // Default A
    const [sourceBType, setSourceBTypeInternal] = useState<SourceType>('Text');  // Default B

    const [sourceAText, setSourceAText] = useState<string>('');
    const [sourceBText, setSourceBText] = useState<string>('');

    const [sourceAFile, setSourceAFile] = useState<File | null>(null);
    const [sourceBFile, setSourceBFile] = useState<File | null>(null);

    const [modelPreset, setModelPreset] = useState<string>('Xenova/clip-vit-base-patch32');
    const [customModelId, setCustomModelId] = useState<string>('');
    const [useGpu, setUseGpu] = useState<boolean>(true);

    const [reparamSigma, setReparamSigma] = useState<number>(0.0);
    const [useReparamA, setUseReparamA] = useState<boolean>(false);
    const [useReparamB, setUseReparamB] = useState<boolean>(false);
    const [textEmbedTypeA, setTextEmbedTypeA] = useState<TextEmbedType>('projected');
    const [textEmbedTypeB, setTextEmbedTypeB] = useState<TextEmbedType>('projected');
    const [videoFps, setVideoFps] = useState<number>(1);

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
        videoFps, setVideoFps
    };
}
