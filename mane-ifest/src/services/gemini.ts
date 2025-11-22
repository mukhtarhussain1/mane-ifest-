import { GoogleGenerativeAI } from "@google/generative-ai";
import { editImageWithOpenAI } from './openai';

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

  // Use Gemini for the explanation
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert hair stylist.
    I have a user with a ${analysis.faceShape} face shape.
    They have selected the "${hairstyleName}" hairstyle.
    
    Provide a brief, exciting explanation of why the "${hairstyleName}" hairstyle suits them.
    Mention features like jawline, forehead, or cheekbones.
    Keep the tone professional and encouraging.
    Return ONLY the explanation text.
  `;

  try {
    // 1. Get Explanation from Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanationText = response.text();

    // 2. Edit Image using OpenAI (DALL-E 2)
    const generatedImage = await editImageWithOpenAI(originalImageBase64, hairstyleName, analysis);

    if (generatedImage) {
      return {
        image: generatedImage,
        explanation: explanationText.trim()
      };
    }
    
    // Fallback if OpenAI generation fails
    console.warn("OpenAI did not return an image.");
    return {
      image: originalImageBase64,
      explanation: explanationText.trim() || "Could not generate the image, but here is the explanation."
    };

  } catch (error) {
    console.error("Generation Error:", error);
    return {
      image: originalImageBase64,
      explanation: `This style is a great choice for your ${analysis.faceShape} face shape! It helps balance your features.`
    };
  }
};
