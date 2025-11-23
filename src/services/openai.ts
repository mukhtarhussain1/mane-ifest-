import OpenAI from 'openai';
import type { AnalysisResult } from './gemini';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI client
const openai = API_KEY ? new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

// Singleton for ImageSegmenter to avoid reloading model
let imageSegmenter: ImageSegmenter | null = null;

const initializeSegmenter = async () => {
  if (imageSegmenter) return imageSegmenter;

  try {
    console.log("Initializing MediaPipe Segmenter...");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false
    });
    console.log("MediaPipe Segmenter initialized successfully");
    return imageSegmenter;
  } catch (error) {
    console.error("Failed to initialize ImageSegmenter:", error);
    return null;
  }
};

// Helper to process image for OpenAI Edit API (Square, PNG, <4MB)
// Uses MediaPipe for accurate masking.
const prepareImageAndMask = async (base64Image: string): Promise<{ image: File, mask: File }> => {
  // Ensure segmenter is ready
  await initializeSegmenter();

  return new Promise((resolve, reject) => {
    const img = new Image();
    // img.crossOrigin = "anonymous"; // Removed to avoid potential taint issues with data URIs
    img.onload = async () => {
      try {
        console.log("Image loaded for processing");
        const size = 1024; // OpenAI standard size
        
        // 1. Create Main Image Canvas
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error("No context")); return; }

        // Draw image centered and covered
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const imageBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
        if (!imageBlob) throw new Error("Failed to create image blob");
        const imageFile = new File([imageBlob], "image.png", { type: "image/png" });

        // 2. Create Mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error("No mask context");

        // Default: Opaque (Keep everything)
        maskCtx.fillStyle = 'rgba(0, 0, 0, 1)'; 
        maskCtx.fillRect(0, 0, size, size);

        let maskGenerated = false;

        if (imageSegmenter) {
          try {
            console.log("Segmenting image...");
            // Get Segmentation
            const segmentationResult = imageSegmenter.segment(canvas);
            const categoryMask = segmentationResult.categoryMask;

            if (categoryMask) {
              const maskData = categoryMask.getAsUint8Array();
              const width = canvas.width;
              const height = canvas.height;

              // Find bounds of the person (category 1)
              let minX = width, minY = height, maxX = 0, maxY = 0;
              let hasPerson = false;

              for (let i = 0; i < maskData.length; i++) {
                if (maskData[i] === 1) { // 1 = Person
                  const px = i % width;
                  const py = Math.floor(i / width);
                  minX = Math.min(minX, px);
                  minY = Math.min(minY, py);
                  maxX = Math.max(maxX, px);
                  maxY = Math.max(maxY, py);
                  hasPerson = true;
                }
              }

              if (hasPerson) {
                console.log("Person detected, creating hair mask...");
                // Heuristic: Hair is in the top portion of the person bounding box.
                // Let's define the "Hair Area" as the top 45% of the person's bounding box.
                // We will make this area Transparent (Edit).
                // We will also feather it.
                
                const personHeight = maxY - minY;
                const hairBottom = minY + (personHeight * 0.45);
                
                // Draw the mask based on this heuristic
                // We want: 
                // - Pixels that are PERSON (mask=1) AND ABOVE hairBottom -> Transparent (Edit)
                // - Everything else -> Opaque (Keep)
                
                const outputImage = maskCtx.createImageData(width, height);
                const data = outputImage.data;

                for (let i = 0; i < maskData.length; i++) {
                  const isPerson = maskData[i] === 1;
                  const py = Math.floor(i / width);
                  
                  const idx = i * 4;
                  // Default: Black (Opaque/Keep) -> Alpha = 255
                  let alpha = 255; 

                  if (isPerson) {
                    if (py < hairBottom) {
                      // Hair area: Transparent (Edit) -> Alpha = 0
                      alpha = 0;
                      
                      // Gradient blending at the bottom of the hair area
                      const blendRange = 50; // pixels
                      if (py > hairBottom - blendRange) {
                         const ratio = (py - (hairBottom - blendRange)) / blendRange;
                         alpha = Math.floor(ratio * 255);
                      }
                    }
                  }
                  
                  // OpenAI Mask: 
                  // Fully Transparent (Alpha=0) = Edit
                  // Fully Opaque (Alpha=255) = Keep
                  // We set the alpha channel. RGB doesn't matter much but usually Black.
                  
                  data[idx] = 0;     // R
                  data[idx + 1] = 0; // G
                  data[idx + 2] = 0; // B
                  data[idx + 3] = alpha; // A
                }
                
                maskCtx.putImageData(outputImage, 0, 0);
                maskGenerated = true;
              } else {
                console.warn("No person detected in segmentation.");
              }
            }
          } catch (segError) {
            console.error("Segmentation failed during processing:", segError);
          }
        } else {
          console.warn("ImageSegmenter not available, using fallback.");
        }

        // Fallback if segmentation failed or no person found
        if (!maskGenerated) {
          console.log("Using fallback gradient mask.");
          maskCtx.globalCompositeOperation = 'destination-out'; // Makes new drawings transparent
          const gradient = maskCtx.createLinearGradient(0, 0, 0, size);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // Top is fully transparent
          gradient.addColorStop(0.4, 'rgba(0, 0, 0, 1)'); // Transparent until 40% down
          gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)'); // Fully opaque by 70% down
          
          maskCtx.fillStyle = gradient;
          maskCtx.fillRect(0, 0, size, size);
        }

        maskCanvas.toBlob((maskBlob) => {
          if (!maskBlob) { reject(new Error("Failed to create mask blob")); return; }
          const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
          resolve({ image: imageFile, mask: maskFile });
        }, 'image/png');

      } catch (e) {
        console.error("Error in prepareImageAndMask:", e);
        reject(e);
      }
    };
    img.onerror = (e) => {
      console.error("Image load error:", e);
      reject(new Error("Failed to load image"));
    };
    img.src = base64Image;
  });
};

export const editImageWithOpenAI = async (
  originalImageBase64: string,
  hairstyleName: string,
  analysis: AnalysisResult
): Promise<string | null> => {
  if (!openai) {
    console.error("OpenAI API Key is missing.");
    return null;
  }

  try {
    console.log("Starting OpenAI image edit...");
    const { image, mask } = await prepareImageAndMask(originalImageBase64);
    console.log("Image and mask prepared.");

    const prompt = `
      A photorealistic photo of a person with ${analysis.skinTone} skin and ${analysis.hairColor} hair.
      Change their hairstyle to a ${hairstyleName}.
      Keep the face and background exactly as they are.
      High quality, realistic texture.
    `;

    const response = await openai.images.edit({
      model: "dall-e-2",
      image: image,
      mask: mask,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    if (response.data && response.data.length > 0) {
      const resultImage = response.data[0].b64_json;
      if (resultImage) {
        console.log("OpenAI returned an image.");
        return `data:image/png;base64,${resultImage}`;
      }
    }
    console.warn("OpenAI returned no data.");
    return null;
  } catch (error) {
    console.error("OpenAI Image Editing Error:", error);
    return null;
  }
};

