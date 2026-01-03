import { useState } from 'react';

export function usePrediction() {
    const [calculating, setCalculating] = useState(false);
    const [results, setResults] = useState<any>(null); // Type this properly if possible
    const [error, setError] = useState<string | null>(null);

    const predict = async (
        sourceAType: string,
        sourceBType: string,
        sourceAText: string,
        sourceBText: string,
        sourceAFile: File | null,
        sourceBFile: File | null,
        reparamSigma: number,
        textEmbedType: string
    ) => {
        setCalculating(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append('source_a_type', sourceAType);
        formData.append('source_b_type', sourceBType);

        if (sourceAText) formData.append('source_a_text', sourceAText);
        if (sourceBText) formData.append('source_b_text', sourceBText);

        if (sourceAFile) formData.append('source_a_file', sourceAFile);
        if (sourceBFile) formData.append('source_b_file', sourceBFile);

        formData.append('reparam_sigma', String(reparamSigma));
        formData.append('text_embed_type', textEmbedType);

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
