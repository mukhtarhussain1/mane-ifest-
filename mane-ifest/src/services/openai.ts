import OpenAI from 'openai';
import type { AnalysisResult } from './gemini';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI client
// Dangerously allowing browser usage as this is a client-side demo app.
// In production, this should be proxied through a backend.
const openai = API_KEY ? new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true
}) : null;

// Helper to process image for OpenAI Edit API (Square, PNG, <4MB)
// Also generates a mask.
const prepareImageAndMask = async (base64Image: string): Promise<{ image: File, mask: File }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 1024; // OpenAI standard size
      
      // 1. Create the main image canvas (Square)
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error("No context")); return; }

      // Draw image centered and covered (or contained)
      // We'll use "cover" strategy to fill the square
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      
      ctx.fillStyle = 'white'; // Background color if not covering
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Convert to Blob/File
      canvas.toBlob((imageBlob) => {
        if (!imageBlob) { reject(new Error("Failed to create image blob")); return; }
        const imageFile = new File([imageBlob], "image.png", { type: "image/png" });

        // 2. Create the Mask
        // The mask should be transparent where we want to edit (hair) and opaque where we want to keep (face/body).
        // Since we don't have segmentation, we'll use a heuristic:
        // Assume hair is mostly in the top half and sides.
        // We'll make the top 50% transparent, and fade out? 
        // OpenAI Mask: Transparent pixels = allow edit. Opaque pixels = keep.
        
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = size;
        maskCanvas.height = size;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) { reject(new Error("No mask context")); return; }

        // Fill with opaque color (KEEP)
        maskCtx.fillStyle = 'rgba(0, 0, 0, 1)'; 
        maskCtx.fillRect(0, 0, size, size);

        // Clear the top area to make it transparent (EDIT)
        // We'll assume hair is in the top 60% roughly.
        // This is a rough heuristic.
        maskCtx.globalCompositeOperation = 'destination-out';
        
        // Create a gradient to blend the edit area? 
        // DALL-E 2 supports alpha channel in mask.
        const gradient = maskCtx.createLinearGradient(0, 0, 0, size);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // Top: Fully transparent (Edit)
        gradient.addColorStop(0.4, 'rgba(0, 0, 0, 1)'); // Middle-Top: Fully transparent (Edit)
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)'); // Bottom: Opaque (Keep)
        
        maskCtx.fillStyle = gradient;
        maskCtx.fillRect(0, 0, size, size);

        maskCanvas.toBlob((maskBlob) => {
          if (!maskBlob) { reject(new Error("Failed to create mask blob")); return; }
          const maskFile = new File([maskBlob], "mask.png", { type: "image/png" });
          resolve({ image: imageFile, mask: maskFile });
        }, 'image/png');

      }, 'image/png');
    };
    img.onerror = reject;
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
    // Prepare image and mask
    const { image, mask } = await prepareImageAndMask(originalImageBase64);

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
        return `data:image/png;base64,${resultImage}`;
      }
    }
    return null;
  } catch (error) {
    console.error("OpenAI Image Editing Error:", error);
    return null;
  }
};
