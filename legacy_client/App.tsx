import React, { useEffect, useRef, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import { DEFAULT_MODEL } from './constants';
import { LoadingStatus, ProgressData, InferenceResult, WorkerMessage, WorkerResponse } from './types';
// Import the worker code string
import workerCode from './worker';

const App: React.FC = () => {
  // State
  const [modelId, setModelId] = useState(DEFAULT_MODEL);
  
  // Initialize useGpu based on browser support
  const [useGpu, setUseGpu] = useState(() => {
    // Basic check for WebGPU support
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      return true;
    }
    return false;
  });

  const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>('idle');
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<InferenceResult | null>(null);

  // Worker Reference
  const workerRef = useRef<Worker | null>(null);

  // Initialize Worker
  useEffect(() => {
    if (!workerRef.current) {
      // Create a Blob from the worker code string
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      workerRef.current = new Worker(workerUrl, { type: 'module' });

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, data } = event.data;

        switch (type) {
          case 'progress':
            setProgress(data);
            break;
          case 'ready':
            setLoadingStatus('ready');
            setProgress(null);
            break;
          case 'result':
            setResult(data);
            setIsCalculating(false);
            break;
          case 'error':
            setErrorMessage(data.message);
            setLoadingStatus('error');
            setIsCalculating(false);
            break;
        }
      };

      // Cleanup
      return () => {
        workerRef.current?.terminate();
        workerRef.current = null;
        URL.revokeObjectURL(workerUrl);
      };
    }
  }, []);

  const handleLoadModel = useCallback(() => {
    if (!workerRef.current) return;
    
    setLoadingStatus('loading');
    setErrorMessage(null);
    setProgress(null);

    const message: WorkerMessage = {
      type: 'load',
      data: {
        modelId,
        useGpu
      }
    };
    workerRef.current.postMessage(message);
  }, [modelId, useGpu]);

  const handleCalculate = useCallback((text: string, image: File) => {
    if (!workerRef.current) return;

    setIsCalculating(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const resultData = e.target?.result;
      
      const message: WorkerMessage = {
        type: 'run',
        data: {
          text,
          imageBlob: resultData // Passing Base64/DataURL
        }
      };
      workerRef.current?.postMessage(message);
    };
    reader.readAsDataURL(image);

  }, []);

  return (
    <div className="grid grid-cols-12 h-screen overflow-hidden bg-white">
      {/* Left Sidebar (3/12 columns on desktop) */}
      <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full border-r border-gray-200 z-10 shadow-lg md:shadow-none">
        <Sidebar
          modelId={modelId}
          setModelId={setModelId}
          useGpu={useGpu}
          setUseGpu={setUseGpu}
          onLoadModel={handleLoadModel}
          loadingStatus={loadingStatus}
          progress={progress}
          errorMessage={errorMessage}
        />
      </div>

      {/* Main Workspace (9/12 columns on desktop) */}
      <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full relative">
        <Workspace
          loadingStatus={loadingStatus}
          onCalculate={handleCalculate}
          isCalculating={isCalculating}
          result={result}
        />
      </div>
    </div>
  );
};

export default App;