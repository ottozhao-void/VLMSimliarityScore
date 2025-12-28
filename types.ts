export interface ModelConfig {
  id: string;
  useGpu: boolean;
}

export interface InferenceResult {
  score: number; // 0-1 or 0-100
  time: number; // ms
}

export type LoadingStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ProgressData {
  status: string;
  name: string;
  file: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

// Worker Message Types
export interface WorkerMessage {
  type: 'load' | 'run';
  data: any;
}

export interface WorkerResponse {
  type: 'progress' | 'ready' | 'result' | 'error';
  data: any;
}
