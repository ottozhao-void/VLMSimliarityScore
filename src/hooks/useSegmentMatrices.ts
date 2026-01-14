
import { useMemo } from 'react';
import { FrameResult } from '../types';

export interface MatrixData {
    matrix: (number | null)[][];
    rows_time: number[];
    cols_time: number[];
}

export function useSegmentMatrices(
    curve: FrameResult[] | null,
    relevantWindows: number[][] | undefined
) {
    return useMemo(() => {
        if (!curve || curve.length === 0) {
            return { crossSim: null, giou: null };
        }

        const timestamps = curve.map(f => f.time);
        const scores = curve.map(f => f.score);
        const n = curve.length;

        // Estimate frame duration for GIoU (assuming roughly uniform)
        // If n < 2, default to 1s or 0s
        let frameDur = 0;
        if (n > 1) {
            frameDur = (timestamps[n - 1] - timestamps[0]) / (n - 1);
        } else if (n === 1 && relevantWindows) {
            // Edge case: single frame. If video duration known? 
            // We assume small epsilon if unknown.
            frameDur = 0.1; 
        }

        // --- 1. Cross-Similarity Matrix ---
        // Axes: Start Index (i) -> End Index (j)
        // Value: Avg score from i to j
        
        // Precompute prefix sums for O(1) range queries
        // P[k] = sum(scores[0]...scores[k-1]) -> P[0]=0
        const P = new Float64Array(n + 1);
        P[0] = 0;
        for (let i = 0; i < n; i++) {
            P[i + 1] = P[i] + scores[i];
        }

        const crossMatrix: (number | null)[][] = new Array(n);
        
        for (let i = 0; i < n; i++) {
            crossMatrix[i] = new Array(n).fill(null);
            for (let j = i; j < n; j++) {
                // Sum from i to j (inclusive) is P[j+1] - P[i]
                const sum = P[j + 1] - P[i];
                const count = j - i + 1;
                crossMatrix[i][j] = sum / count;
            }
        }

        const crossData: MatrixData = {
            matrix: crossMatrix,
            rows_time: timestamps, // Start Time
            cols_time: timestamps  // End Time
        };


        // --- 2. GIoU Matrix ---
        // Only if relevantWindows (GT) exists
        let giouData: MatrixData | null = null;
        
        if (relevantWindows && relevantWindows.length > 0) {
            const gMatrix: (number | null)[][] = new Array(n);
            
            for (let i = 0; i < n; i++) {
                gMatrix[i] = new Array(n).fill(null);
                for (let j = i; j < n; j++) {
                    const startT = timestamps[i];
                    // End time is the start of frame j + duration
                    const endT = timestamps[j] + frameDur;
                    
                    const segment = [startT, endT];
                    
                    // Compute GIoU against all GTs and take average
                    let totalGiou = 0;
                    for (const gt of relevantWindows) {
                        totalGiou += calculateGIoU(segment, gt);
                    }
                    gMatrix[i][j] = totalGiou / relevantWindows.length;
                }
            }
            
            giouData = {
                matrix: gMatrix,
                rows_time: timestamps,
                cols_time: timestamps
            };
        }

        return { crossSim: crossData, giou: giouData };

    }, [curve, relevantWindows]);
}

/**
 * Calculates Generalized Intersection over Union (GIoU) for 1D segments.
 * Segments are [start, end].
 */
function calculateGIoU(boxA: number[], boxB: number[]): number {
    const [a1, a2] = boxA;
    const [b1, b2] = boxB;

    // Intersection
    const x1 = Math.max(a1, b1);
    const x2 = Math.min(a2, b2);
    const intersection = Math.max(0, x2 - x1);

    // Union
    const areaA = a2 - a1;
    const areaB = b2 - b1;
    const union = areaA + areaB - intersection;
    
    // Convex Hull (Smallest enclosing box)
    const c1 = Math.min(a1, b1);
    const c2 = Math.max(a2, b2);
    const cArea = c2 - c1;

    if (cArea === 0) return 0; // Should not happen if duration > 0

    // IoU
    const iou = union === 0 ? 0 : intersection / union;

    // GIoU
    return iou - ((cArea - union) / cArea);
}
