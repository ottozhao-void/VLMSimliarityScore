const WORKER_CODE = `
import { pipeline, env, AutoTokenizer, AutoProcessor, CLIPTextModelWithProjection, CLIPVisionModelWithProjection } from 'https://esm.sh/@xenova/transformers@2.17.2';

// Setup environment for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Globals to hold the loaded pipeline/models
let processor = null;
let textModel = null;
let visionModel = null;
let tokenizer = null;
let currentModelId = null;

// Helper to calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'load') {
    const { modelId, useGpu } = data;

    try {
      if (currentModelId === modelId && processor && textModel && visionModel) {
        self.postMessage({ type: 'ready', data: { message: 'Model already loaded' } });
        return;
      }

      const device = useGpu ? 'webgpu' : 'wasm';
      
      // Callback for progress updates
      const progressCallback = (x) => {
        self.postMessage({ type: 'progress', data: x });
      };

      self.postMessage({ type: 'progress', data: { status: 'initiate', name: modelId, file: 'config' } });

      tokenizer = await AutoTokenizer.from_pretrained(modelId, { progress_callback: progressCallback });
      processor = await AutoProcessor.from_pretrained(modelId, { progress_callback: progressCallback });
      
      textModel = await CLIPTextModelWithProjection.from_pretrained(modelId, { 
        quantized: true, 
        device,
        progress_callback: progressCallback 
      });
      
      visionModel = await CLIPVisionModelWithProjection.from_pretrained(modelId, { 
        quantized: true, 
        device,
        progress_callback: progressCallback 
      });

      currentModelId = modelId;
      self.postMessage({ type: 'ready', data: { message: 'Model loaded successfully' } });

    } catch (err) {
      console.error(err);
      self.postMessage({ type: 'error', data: { message: err.message || 'Failed to load model' } });
    }
  } else if (type === 'run') {
    const { text, imageBlob } = data;

    if (!processor || !textModel || !visionModel) {
      self.postMessage({ type: 'error', data: { message: 'Model not loaded' } });
      return;
    }

    try {
      const startTime = performance.now();

      // 1. Process Text
      const textInputs = tokenizer(text, { padding: true, truncation: true, return_tensors: 'pt' });
      const { text_embeds } = await textModel(textInputs);
      
      // 2. Process Image
      const imageInputs = await processor(imageBlob, { return_tensors: 'pt' });
      const { image_embeds } = await visionModel(imageInputs);

      // 3. Compute Similarity
      const textVec = text_embeds.data;
      const imageVec = image_embeds.data;

      const similarity = cosineSimilarity(textVec, imageVec);
      
      const endTime = performance.now();

      self.postMessage({
        type: 'result',
        data: {
          score: similarity,
          time: endTime - startTime
        }
      });

    } catch (err) {
      console.error(err);
      self.postMessage({ type: 'error', data: { message: err.message || 'Inference failed' } });
    }
  }
});
`;

export default WORKER_CODE;
