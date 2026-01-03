import { useState } from 'react';
import { toast } from 'sonner';

export function useModel() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const loadModel = async (modelId: string, useGpu: boolean) => {
        if (!modelId) return;

        setStatus('loading');
        setMessage('');

        try {
            const res = await fetch('/api/load_model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id: modelId, use_gpu: useGpu })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Failed to load model');
            }

            setStatus('ready');
            setMessage('Model loaded successfully');
            toast.success('Model loaded successfully');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setMessage(err.message || String(err));
            toast.error(err.message || String(err));
        }
    };

    return { status, message, loadModel };
}
