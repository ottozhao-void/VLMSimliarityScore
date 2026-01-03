import { useState } from 'react';

export type SourceType = 'Image' | 'Video' | 'Text' | 'Random';
export type Tab = 'source' | 'general';
export type TextEmbedType = 'projected' | 'pooler_output';

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
    textEmbedType: TextEmbedType;
}

export function useAppState() {
    const [tab, setTab] = useState<Tab>('source');

    const [sourceAType, setSourceAType] = useState<SourceType>('Video'); // Default A
    const [sourceBType, setSourceBType] = useState<SourceType>('Text');  // Default B

    const [sourceAText, setSourceAText] = useState<string>('');
    const [sourceBText, setSourceBText] = useState<string>('');

    const [sourceAFile, setSourceAFile] = useState<File | null>(null);
    const [sourceBFile, setSourceBFile] = useState<File | null>(null);

    const [modelPreset, setModelPreset] = useState<string>('openai/clip-vit-large-patch14');
    const [customModelId, setCustomModelId] = useState<string>('');
    const [useGpu, setUseGpu] = useState<boolean>(true);

    const [reparamSigma, setReparamSigma] = useState<number>(0.0);
    const [textEmbedType, setTextEmbedType] = useState<TextEmbedType>('projected');

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
        textEmbedType, setTextEmbedType
    };
}
