/**
 * Post-processing algorithms for similarity scores.
 * Uses a registry pattern for easy extensibility.
 */

import { FrameResult } from '../types';

// Algorithm identifier type - extend as needed
export type AlgorithmId = 'raw' | 'zscore-sigmoid';

export interface Algorithm {
    id: AlgorithmId;
    label: string;
    description: string;
    process: (scores: number[]) => number[];
}

/**
 * Z-Score normalization followed by Sigmoid activation.
 * Transforms scores to 0-1 range with enhanced contrast.
 */
function zscoreSigmoid(scores: number[]): number[] {
    if (scores.length === 0) return [];

    // Calculate mean
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    // Calculate standard deviation
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const std = Math.sqrt(variance);

    // Avoid division by zero
    if (std === 0) {
        // All values are the same, return 0.5 for all
        return scores.map(() => 0.5);
    }

    // Apply Z-Score then Sigmoid
    return scores.map(score => {
        const zScore = (score - mean) / std;
        const sigmoid = 1 / (1 + Math.exp(-zScore));
        return sigmoid;
    });
}

/**
 * Raw passthrough - no processing.
 */
function raw(scores: number[]): number[] {
    return scores;
}

/**
 * Registry of available algorithms.
 * Add new algorithms here through the registration function.
 */
export const ALGORITHMS: Algorithm[] = [
    {
        id: 'raw',
        label: 'Raw',
        description: 'No processing, original cosine similarity values',
        process: raw
    },
    {
        id: 'zscore-sigmoid',
        label: 'ZScore-Sigmoid',
        description: 'Z-Score normalization followed by Sigmoid activation',
        process: zscoreSigmoid
    }
];

/**
 * Get algorithm by ID.
 */
export function getAlgorithm(id: AlgorithmId): Algorithm | undefined {
    return ALGORITHMS.find(a => a.id === id);
}

/**
 * Apply post-processing algorithm to FrameResult array.
 * Returns a new array with processed scores.
 */
export function applyAlgorithm(algorithmId: AlgorithmId, curve: FrameResult[]): FrameResult[] {
    const algorithm = getAlgorithm(algorithmId);
    if (!algorithm) {
        console.warn(`Unknown algorithm: ${algorithmId}, returning raw data`);
        return curve;
    }

    const scores = curve.map(f => f.score);
    const processedScores = algorithm.process(scores);

    return curve.map((frame, i) => ({
        time: frame.time,
        score: processedScores[i]
    }));
}
