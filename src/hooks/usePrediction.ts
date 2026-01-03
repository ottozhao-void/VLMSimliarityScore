import { useState } from 'react';

export function usePrediction() {
    const [calculating, setCalculating] = useState(false);
    const [results, setResults] = useState<any>(null); // Type this properly if possible
    const [error, setError] = useState<string | null>(null);

    const predict = async (
        imageSource: string,
        textSource: string,
        text: string,
        image: File | null,
        video: File | null
    ) => {
        setCalculating(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append('image_source', imageSource);
        formData.append('text_source', textSource);
        if (text) formData.append('text', text);
        if (imageSource === 'Image' && image) formData.append('image', image);
        if (imageSource === 'Video' && video) formData.append('video', video);

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
