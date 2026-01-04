import { useState } from 'react';
import { FileSource, ServerFileRef, QVHighlightsQuery } from './useAppState';

export function usePrediction() {
    const [calculating, setCalculating] = useState(false);
    const [results, setResults] = useState<any>(null); // Type this properly if possible
    const [error, setError] = useState<string | null>(null);

    const predict = async (
        sourceAType: string,
        sourceBType: string,
        sourceAText: string,
        sourceBText: string,
        sourceAFile: FileSource,
        sourceBFile: FileSource,
        reparamSigmaA: number,
        reparamSigmaB: number,
        textEmbedTypeA: string,
        textEmbedTypeB: string,
        videoFps: number,
        selectedQVQuery?: QVHighlightsQuery | null
    ) => {
        setCalculating(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append('source_a_type', sourceAType);
        formData.append('source_b_type', sourceBType);

        if (sourceAText) formData.append('source_a_text', sourceAText);
        if (sourceBText) formData.append('source_b_text', sourceBText);

        // Handle source A file - check if it's a server reference or local file
        if (sourceAFile) {
            if ('type' in sourceAFile && sourceAFile.type === 'server') {
                formData.append('source_a_server_path', (sourceAFile as ServerFileRef).path);
            } else if (sourceAFile instanceof File) {
                formData.append('source_a_file', sourceAFile);
            }
        }

        // Handle source B file - check if it's a server reference or local file
        if (sourceBFile) {
            if ('type' in sourceBFile && sourceBFile.type === 'server') {
                formData.append('source_b_server_path', (sourceBFile as ServerFileRef).path);
            } else if (sourceBFile instanceof File) {
                formData.append('source_b_file', sourceBFile);
            }
        }

        // Handle DATASET:QVHighlights - send query data
        if (selectedQVQuery && (sourceAType === 'DATASET:QVHighlights' || sourceBType === 'DATASET:QVHighlights')) {
            formData.append('qv_query', selectedQVQuery.query);
            formData.append('qv_vid', selectedQVQuery.vid);
            formData.append('qv_duration', String(selectedQVQuery.duration));
        }

        formData.append('reparam_sigma_a', String(reparamSigmaA));
        formData.append('reparam_sigma_b', String(reparamSigmaB));
        formData.append('text_embed_type_a', textEmbedTypeA);
        formData.append('text_embed_type_b', textEmbedTypeB);
        formData.append('video_fps', String(videoFps));

        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Prediction failed');
            }

            const data = await res.json();
            setResults(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || String(err));
            alert('Error: ' + (err.message || String(err)));
        } finally {
            setCalculating(false);
        }
    };

    return { calculating, results, error, predict };
}
