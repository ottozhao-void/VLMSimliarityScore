
import { AutoTokenizer, AutoProcessor, AutoModel } from '@xenova/transformers';
import path from 'path';

// Define model ID
const MODEL_ID = 'Xenova/siglip-so400m-patch14-384';
const IMAGE_PATH = 'C:/Users/Hasee/.gemini/antigravity/brain/61f80137-c6c4-43ac-ba44-f0b78df6d302/test_image_1766930512895.png';

async function main() {
    console.log("Loading model...");
    const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    const processor = await AutoProcessor.from_pretrained(MODEL_ID);
    const model = await AutoModel.from_pretrained(MODEL_ID, { quantized: true });

    console.log("Model loaded.");

    const text = "A blue square";
    console.log("Tokenizing text:", text);
    // Match the logic in worker.ts
    const textInputs = tokenizer(text, { padding: 'max_length', truncation: true });
    console.log("Text Inputs Keys:", Object.keys(textInputs));

    console.log("Processing image...");
    // In Node, passing file path usually works, or url.
    const imageInputs = await processor(IMAGE_PATH);
    console.log("Image Inputs Keys:", Object.keys(imageInputs));

    if (!textInputs.input_ids) console.error("Missing input_ids");
    if (!imageInputs.pixel_values) console.error("Missing pixel_values");

    console.log("Running model...");
    try {
        const { text_embeds, image_embeds } = await model({
            ...textInputs,
            ...imageInputs
        });
        console.log("Success!");
        console.log("Text Embeds shape:", text_embeds.dims);
    } catch (e) {
        console.error("Error during model execution:");
        console.error(e);
    }
}

main();
