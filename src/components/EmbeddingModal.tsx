import { useState } from 'react';
import { X, Copy, Check, Braces } from 'lucide-react';
import { toast } from 'sonner';

interface EmbeddingModalProps {
    isOpen: boolean;
    onClose: () => void;
    embedding: number[][] | null;
    embedDim: number | null;
    sourceLabel: string;
}

export default function EmbeddingModal({ isOpen, onClose, embedding, embedDim, sourceLabel }: EmbeddingModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !embedding) return null;

    const numVectors = embedding.length;
    const dim = embedDim || (embedding[0]?.length ?? 0);

    // Format a single vector for display (show first 5 and last 3 values)
    const formatVector = (vec: number[]) => {
        if (vec.length <= 10) {
            return vec.map(v => v.toFixed(6)).join(', ');
        }
        const first = vec.slice(0, 5).map(v => v.toFixed(6));
        const last = vec.slice(-3).map(v => v.toFixed(6));
        return `${first.join(', ')}, ... , ${last.join(', ')}`;
    };

    const handleCopy = async () => {
        try {
            // Format as JSON for copying
            const text = JSON.stringify(embedding, null, 2);

            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }

            setCopied(true);
            toast.success('Embedding copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            toast.error('Failed to copy embedding');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Braces size={18} className="text-gray-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{sourceLabel} Embedding</h3>
                            <p className="text-xs text-gray-500">
                                {numVectors} vector{numVectors !== 1 ? 's' : ''} × {dim} dimensions
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${copied
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            {copied ? 'Copied!' : 'Copy JSON'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {embedding.map((vec, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    Vector {idx + 1}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                    [{dim} dims]
                                </span>
                            </div>
                            <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                                [{formatVector(vec)}]
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <p className="text-[10px] text-gray-400 text-center">
                        Tip: Use "Copy JSON" to export the full embedding vectors
                    </p>
                </div>
            </div>
        </div>
    );
}
