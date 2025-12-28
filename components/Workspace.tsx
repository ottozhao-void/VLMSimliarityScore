import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, Play, Clock, BarChart3, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils';
import { LoadingStatus, InferenceResult } from '../types';

interface WorkspaceProps {
  loadingStatus: LoadingStatus;
  onCalculate: (text: string, image: File) => void;
  isCalculating: boolean;
  result: InferenceResult | null;
}

const Workspace: React.FC<WorkspaceProps> = ({
  loadingStatus,
  onCalculate,
  isCalculating,
  result
}) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.match('image.*')) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const canCalculate = loadingStatus === 'ready' && text.trim().length > 0 && image !== null;

  return (
    <div className="flex flex-col h-full bg-white relative overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-8 space-y-8">
        
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Similarity Analysis</h2>
          <p className="text-gray-500 mt-1">Upload an image and provide a text prompt to measure semantic alignment.</p>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Image Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Image Source</label>
              {image && (
                <button onClick={clearImage} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            <div 
              className={cn(
                "border-2 border-dashed rounded-xl h-[300px] flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden group",
                imagePreview ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-black bg-gray-50 hover:bg-gray-100 cursor-pointer"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg"
              />
              
              {imagePreview ? (
                <div className="relative w-full h-full p-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-gray-600">
                  <div className="p-4 bg-white rounded-full shadow-sm">
                    <UploadCloud size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Text Input */}
          <div className="space-y-4 flex flex-col">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Text Query / Prompt</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter a description or prompt to compare with the image..."
              className="w-full flex-1 min-h-[300px] p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end pt-6 border-t border-gray-100">
          <button
            onClick={() => image && onCalculate(text, image)}
            disabled={!canCalculate || isCalculating}
            className={cn(
              "flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg",
              !canCalculate || isCalculating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-black text-white hover:bg-gray-800 hover:shadow-xl active:scale-95"
            )}
          >
            {isCalculating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Computing...
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Calculate Similarity
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-gray-500">
                <BarChart3 size={20} />
                <span className="text-sm font-medium uppercase tracking-wider">Analysis Results</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-gray-500 font-medium mb-2">Semantic Similarity Score</span>
                  <div className="text-6xl font-black text-gray-900 tracking-tight">
                    {(result.score * 100).toFixed(2)}<span className="text-3xl text-gray-400 ml-1">%</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Inference Time</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{result.time.toFixed(0)} ms</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ImageIcon size={18} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Model Used</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">SigLIP (SO400M)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;
