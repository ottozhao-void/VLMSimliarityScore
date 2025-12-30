
const WORKER_CODE = `
import { env, AutoTokenizer, AutoProcessor, AutoModel } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

// Setup environment for browser
env.allowLocalModels = false;
env.useBrowserCache = true;

// Globals to hold the loaded pipeline/models
let processor = null;
let model = null;
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
      if (currentModelId === modelId && processor && model) {
        self.postMessage({ type: 'ready', data: { message: 'Model already loaded' } });
        return;
      }

      // 1. Check/Configure Device
      // Note: 'webgpu' requires browser support. If forced and not available, it might fail.
      // AutoModel.from_pretrained usually falls back if device is not specified, but we are being specific.
      const device = useGpu ? 'webgpu' : 'wasm';
      
      // Callback for progress updates
      const progressCallback = (x) => {
        self.postMessage({ type: 'progress', data: x });
      };

      self.postMessage({ type: 'progress', data: { status: 'initiate', name: modelId, file: 'config' } });

      // 2. Load Tokenizer & Processor
      tokenizer = await AutoTokenizer.from_pretrained(modelId, { progress_callback: progressCallback });
      processor = await AutoProcessor.from_pretrained(modelId, { progress_callback: progressCallback });
      
      // 3. Load Model
      // We wrap this to catch specific backend errors (like WebGPU missing)
      try {
        model = await AutoModel.from_pretrained(modelId, { 
          quantized: true, 
          device,
          progress_callback: progressCallback 
        });
      } catch (e) {
        // If WebGPU fails, try falling back to WASM if the user asked for GPU
        if (useGpu) {
          console.warn("WebGPU load failed, attempting WASM fallback...", e);
          self.postMessage({ type: 'progress', data: { status: 'fallback', name: modelId, file: 'Falling back to CPU (WASM)...' } });
          model = await AutoModel.from_pretrained(modelId, { 
            quantized: true, 
            device: 'wasm',
            progress_callback: progressCallback 
          });
        } else {
          throw e;
        }
      }

      currentModelId = modelId;
      self.postMessage({ type: 'ready', data: { message: 'Model loaded successfully' } });

    } catch (err) {
      console.error(err);
      self.postMessage({ type: 'error', data: { message: err.message || 'Failed to load model' } });
    }
  } else if (type === 'run') {
    const { text, imageBlob } = data;

    if (!processor || !model) {
      self.postMessage({ type: 'error', data: { message: 'Model not loaded' } });
      return;
    }

    try {
      const startTime = performance.now();
      let textInputs, imageInputs;

      // 1. Process Inputs
      try {
        console.log('Tokenizing text:', text);
        // Fix: Wrap text in array to ensure batch dimension [1, seq_len]
        textInputs = tokenizer([text], { padding: 'max_length', truncation: true }); 
        console.log('Text inputs keys:', Object.keys(textInputs));
      } catch (e) {
        throw new Error(\`Tokenizer failed: \${ e.message }\`);
      }

      try {
        console.log('Processing image blob');
        // Ensure imageBlob is processed correctly
        imageInputs = await processor([imageBlob]);
        console.log('Image inputs keys:', Object.keys(imageInputs));
      } catch (e) {
        throw new Error(\`Processor failed: \${ e.message } - Input type: \${ typeof imageBlob } \`);
      }

      if (!textInputs.input_ids) throw new Error("Tokenizer failed to generate input_ids");
      if (!imageInputs.pixel_values) throw new Error("Processor failed to generate pixel_values");

      // 2. Run Inference
      console.log('Running model with inputs');
      let output;
      try {
        output = await model({
          ...textInputs,
          ...imageInputs
        });
      } catch (e) {
         // Check if it is the specific iteration error
         throw new Error(\`Model execution failed: \${ e.message } \`);
      }
      
      const { text_embeds, image_embeds } = output;

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
