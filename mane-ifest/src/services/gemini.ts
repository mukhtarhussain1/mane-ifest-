import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the API only if the key is present
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface HairstyleRecommendation {
  id: string;
  name: string;
  description: string;
  reason: string;
}

export interface AnalysisResult {
  faceShape: string;
  description: string;
  gender: string;
  skinTone: string;
  hairColor: string;
  ageApprox: string;
  recommendations: HairstyleRecommendation[];
}

export const analyzeFaceWithGemini = async (imageBase64: string): Promise<AnalysisResult> => {
  if (!genAI) {
    throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Remove the data URL prefix to get just the base64 string
  const base64Data = imageBase64.split(',')[1];

  const prompt = `
    Analyze this face and determine the following:
    1. Face shape (e.g., Oval, Round, Square, Heart, Diamond, Oblong).
    2. Gender (Male/Female/Non-binary).
    3. Skin tone (e.g., Fair, Medium, Dark, Olive).
    4. Current hair color.
    5. Approximate age range.
    
    Then, suggest 3 hairstyles that would complement this face shape.
    
    Return the response in the following JSON format ONLY, without any markdown formatting:
    {
      "faceShape": "Shape Name",
      "description": "A brief description of the face shape features.",
      "gender": "Gender",
      "skinTone": "Skin Tone",
      "hairColor": "Hair Color",
      "ageApprox": "Age Range",
      "recommendations": [
        {
          "id": "unique_id_1",
          "name": "Hairstyle Name",
          "description": "Brief description of the style",
          "reason": "Why it suits this face shape"
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean up any markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze face. Please try again.");
  }
};

export interface GenerationResult {
  image: string;
  explanation: string;
}

export const generateHairstyleDetails = async (
  originalImageBase64: string, 
  hairstyleName: string,
  analysis: AnalysisResult
): Promise<GenerationResult> => {
  if (!genAI) {
    throw new Error("Gemini API Key is missing.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    I have a user with a ${analysis.faceShape} face shape. They have selected the "${hairstyleName}" hairstyle.
    
    1. Explain specifically WHY this hairstyle looks good on a ${analysis.faceShape} face. Mention features like jawline, forehead, or cheekbones.
    2. Keep the tone exciting, professional, and encouraging.
    3. Return the response in this JSON format ONLY:
    {
      "explanation": "Your detailed explanation here..."
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleanText);

    // Generate Image using Pollinations.ai
    // Construct a detailed prompt for the image generator
    const imagePrompt = encodeURIComponent(
      `photorealistic portrait of a ${analysis.ageApprox} year old ${analysis.gender} with ${analysis.skinTone} skin and ${hairstyleName} hairstyle, ${analysis.hairColor} hair, professional photography, high quality, 8k, sharp focus, studio lighting, looking at camera`
    );
    
    const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?nologo=true&private=true&enhanced=true`;

    return {
      image: imageUrl,
      explanation: json.explanation
    };
  } catch (error) {
    console.error("Generation Error:", error);
    return {
      image: originalImageBase64,
      explanation: `This style is a great choice for your ${analysis.faceShape} face shape! It helps balance your features and highlights your best angles.`
    };
  }
};
