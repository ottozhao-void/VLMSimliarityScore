import { useRef, useEffect } from 'react';

interface CurvePoint {
    time: number;
    score: number;
}

interface SimilarityCurveOverlayProps {
    curve: CurvePoint[];
    duration: number;
    relevantWindows?: number[][];
    height?: number;
}

/**
 * Renders a similarity curve overlay for the video progress bar.
 * Shows the VLM-computed similarity between video frames and query text.
 */
export default function SimilarityCurveOverlay({
    curve,
    duration,
    relevantWindows = [],
    height = 32
}: SimilarityCurveOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || curve.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size based on parent
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = rect.width;
            canvas.height = height;
        }

        const w = canvas.width;
        const h = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // Normalize scores (assuming 0-1 range)
        const maxScore = Math.max(...curve.map(p => p.score), 1);

        // Draw filled curve
        ctx.beginPath();
        ctx.moveTo(0, h);

        for (let i = 0; i < curve.length; i++) {
            const x = (curve[i].time / duration) * w;
            const y = h - (curve[i].score / maxScore) * h * 0.9;  // Leave 10% margin at top
            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Close the path
        const lastX = (curve[curve.length - 1].time / duration) * w;
        ctx.lineTo(lastX, h);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.6)');  // green-500 with opacity
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw curve line
        ctx.beginPath();
        for (let i = 0; i < curve.length; i++) {
            const x = (curve[i].time / duration) * w;
            const y = h - (curve[i].score / maxScore) * h * 0.9;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.strokeStyle = 'rgba(22, 163, 74, 0.9)';  // green-600 with high opacity
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw dashed boundary lines for relevant windows
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';  // Blue
        ctx.lineWidth = 2;

        for (const [start, end] of relevantWindows) {
            const startX = (start / duration) * w;
            const endX = (end / duration) * w;

            // Start boundary
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(startX, h);
            ctx.stroke();

            // End boundary
            ctx.beginPath();
            ctx.moveTo(endX, 0);
            ctx.lineTo(endX, h);
            ctx.stroke();
        }

        ctx.setLineDash([]);  // Reset dash pattern

    }, [curve, duration, relevantWindows, height]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}
