import { useState } from 'react';

export type ImageSource = 'Image' | 'Video' | 'Random';
export type TextSource = 'Text' | 'Random';
export type Tab = 'source' | 'general';

export interface AppState {
    tab: Tab;
    imageSource: ImageSource;
    textSource: TextSource;
    modelPreset: string;
    customModelId: string;
    useGpu: boolean;
    selectedImage: File | null;
    selectedVideo: File | null;
    textInput: string;
}

export function useAppState() {
    const [tab, setTab] = useState<Tab>('source');
    const [imageSource, setImageSource] = useState<ImageSource>('Image');
    const [textSource, setTextSource] = useState<TextSource>('Text');
    const [modelPreset, setModelPreset] = useState<string>('openai/clip-vit-large-patch14');
    const [customModelId, setCustomModelId] = useState<string>('');
    const [useGpu, setUseGpu] = useState<boolean>(true);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [textInput, setTextInput] = useState<string>('');

    // Derived or specific setters can be added here if needed

    return {
        tab, setTab,
        imageSource, setImageSource,
        textSource, setTextSource,
        modelPreset, setModelPreset,
        customModelId, setCustomModelId,
        useGpu, setUseGpu,
        selectedImage, setSelectedImage,
        selectedVideo, setSelectedVideo,
        textInput, setTextInput
    };
}
