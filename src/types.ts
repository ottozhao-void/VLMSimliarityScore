export interface FrameResult {
    time: number;
    score: number;
}

export interface SimilarityMatrixCursor {
    matrix: number[][];
    rows_time?: number[];
    cols_time?: number[];
}

export interface AnalysisResults {
    type: 'scalar' | 'curve' | 'matrix' | 'dataset';
    score?: number | null;
    average_score?: number | null;
    curve?: FrameResult[] | null;
    matrix?: SimilarityMatrixCursor | null;
    best_frame?: FrameResult | null;
    time_taken_ms: number;
}
