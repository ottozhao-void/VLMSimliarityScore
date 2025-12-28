import React, { useState } from 'react';
import { Settings, Cpu, Zap, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DEFAULT_MODEL } from '../constants';
import { cn } from '../utils';
import { LoadingStatus, ProgressData } from '../types';

interface SidebarProps {
  modelId: string;
  setModelId: (id: string) => void;
  useGpu: boolean;
  setUseGpu: (use: boolean) => void;
  onLoadModel: () => void;
  loadingStatus: LoadingStatus;
  progress: ProgressData | null;
  errorMessage: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  modelId,
  setModelId,
  useGpu,
  setUseGpu,
  onLoadModel,
  loadingStatus,
  progress,
  errorMessage,
}) => {
  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 p-6 font-sans">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 bg-black text-white rounded-lg">
          <Settings size={20} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">VLM Scorer</h1>
      </div>

      <div className="space-y-8 flex-1">
        {/* Model Configuration */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Model Configuration</h2>
          
          <div className="space-y-2">
            <label htmlFor="model-id" className="text-sm font-medium text-gray-700 block">
              Hugging Face Repo ID
            </label>
            <input
              id="model-id"
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder={DEFAULT_MODEL}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-400">
              Must be compatible with Transformers.js (ONNX). <br/>
              Recommended: <code className="bg-gray-200 px-1 rounded text-gray-600">{DEFAULT_MODEL}</code>
            </p>
          </div>

          <button
            onClick={onLoadModel}
            disabled={loadingStatus === 'loading' || !modelId}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
              loadingStatus === 'loading' 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800 shadow-sm active:scale-95"
            )}
          >
            {loadingStatus === 'loading' ? (
              <span className="flex items-center gap-2">Loading...</span>
            ) : (
              <>
                <Download size={16} />
                Load Model
              </>
            )}
          </button>

          {/* Progress / Status Indicator */}
          <div className="min-h-[60px]">
            {loadingStatus === 'loading' && progress && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="truncate max-w-[150px]">{progress.file || 'Initializing...'}</span>
                  <span>{progress.progress ? `${Math.round(progress.progress)}%` : '...'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-black h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress.progress || 0}%` }}
                  />
                </div>
              </div>
            )}
            
            {loadingStatus === 'ready' && (
              <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 p-3 rounded-md border border-green-100">
                <CheckCircle2 size={16} />
                <span>Model loaded & ready.</span>
              </div>
            )}

            {loadingStatus === 'error' && errorMessage && (
              <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Hardware Acceleration */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Hardware</h2>
          
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-md", useGpu ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500")}>
                {useGpu ? <Zap size={18} /> : <Cpu size={18} />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">GPU Acceleration</span>
                <span className="text-xs text-gray-500">{useGpu ? 'WebGPU Enabled' : 'CPU Mode'}</span>
              </div>
            </div>
            
            <button
              onClick={() => setUseGpu(!useGpu)}
              disabled={loadingStatus === 'loading' || loadingStatus === 'ready'}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                useGpu ? 'bg-black' : 'bg-gray-200',
                (loadingStatus === 'loading' || loadingStatus === 'ready') && "opacity-50 cursor-not-allowed"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  useGpu ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Change hardware setting before loading the model. WebGPU requires a compatible browser (e.g., Chrome 113+).
          </p>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mt-auto pt-4 border-t border-gray-200">
        Powered by Transformers.js & React
      </div>
    </div>
  );
};

export default Sidebar;