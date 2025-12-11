import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ClothingItem, ClothingCategory, StyleType, WeatherData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";
const IMAGE_MODEL_NAME = "gemini-2.5-flash-image";

/**
 * Analyzes an image of clothing to determine its category, color, and style.
 */
export const analyzeClothingImage = async (base64Image: string): Promise<Partial<ClothingItem>> => {
  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        enum: Object.values(ClothingCategory),
        description: "The category of the clothing item.",
      },
      color: {
        type: Type.STRING,
        description: "The dominant color of the item (e.g., Navy Blue, Beige, Black).",
      },
      style: {
        type: Type.STRING,
        enum: Object.values(StyleType),
        description: "The fashion style of the item.",
      },
      description: {
        type: Type.STRING,
        description: "A short, concise description of the item (e.g., 'Oversized denim jacket').",
      },
    },
    required: ["category", "color", "style", "description"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this clothing item. Identify the category, dominant color, style, and provide a short description.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for consistent classification
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<ClothingItem>;
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Error analyzing clothing:", error);
    throw error;
  }
};

/**
 * Generates outfit suggestions based on the provided wardrobe.
 */
export const generateOutfitSuggestions = async (
  wardrobe: ClothingItem[],
  occasion: string,
  userStylePreference: string,
  weather?: WeatherData | null
): Promise<any[]> => {
  
  if (wardrobe.length === 0) return [];

  const wardrobeSummary = wardrobe.map(item => ({
    id: item.id,
    category: item.category,
    color: item.color,
    style: item.style,
    description: item.description
  }));

  const outfitSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "A catchy name for this outfit." },
        itemIds: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "The exact IDs of the items used in this outfit from the provided list." 
        },
        reasoning: { type: Type.STRING, description: "Why this combination works for the occasion." },
      },
      required: ["name", "itemIds", "reasoning"],
    },
  };

  let weatherContext = "";
  if (weather) {
    weatherContext = `
      CURRENT WEATHER: ${weather.temperature}°C, ${weather.description}.
      Constraint: The outfit MUST be appropriate for this weather.
      ${weather.isRaining ? "It is raining, so prioritize waterproof items or suggest carrying an umbrella (even if not in wardrobe, mention it in reasoning)." : ""}
      ${weather.temperature < 15 ? "It is cold, ensure the outfit provides warmth (layering)." : ""}
      ${weather.temperature > 25 ? "It is hot, ensure the outfit is breathable and light." : ""}
    `;
  }

  const prompt = `
    I have the following clothes in my wardrobe:
    ${JSON.stringify(wardrobeSummary)}

    Please create 3 distinct outfit combinations for a "${occasion}" occasion.
    The user prefers "${userStylePreference}" style, but feel free to mix and match if it looks good.
    ${weatherContext}
    
    Rules:
    1. An outfit must minimally include a TOP and a BOTTOM, or a Dress (if available).
    2. Include SHOES and ACCESSORIES/OUTERWEAR if available and matching.
    3. Only use the IDs provided in the JSON.
    4. Provide fashion advice in the reasoning.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: outfitSchema,
        temperature: 0.7, // Higher creativity for outfits
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error generating outfits:", error);
    throw error;
  }
};

/**
 * Generates a visual representation of the outfit using an image generation model.
 */
export const generateOutfitVisualization = async (
  outfitDescription: string, 
  occasion: string,
  gender: string
): Promise<string | null> => {
  try {
    // Optimized prompt for speed and clarity
    const prompt = `Fashion photography, full body shot, ${gender} model wearing: ${outfitDescription}. Occasion: ${occasion}. Photorealistic, 4k, clean background.`;

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4" 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating outfit visualization:", error);
    return null;
  }
};

/**
 * Rates an outfit and provides styling tips.
 */
export const rateOutfit = async (
  items: ClothingItem[],
  occasion: string
): Promise<{ rating: number; critique: string; stylingTips: string[] }> => {
  const itemsDescription = items.map(i => `${i.color} ${i.style} ${i.category} (${i.description})`).join(', ');
  
  const ratingSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      rating: { 
        type: Type.NUMBER, 
        description: "A score from 1 to 10 based on color coordination, style matching, and appropriateness for the occasion." 
      },
      critique: { 
        type: Type.STRING, 
        description: "A 2-sentence critique explaining the good and bad points of the outfit." 
      },
      stylingTips: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }, 
        description: "3 specific, actionable styling tips to improve the look (e.g. 'Tuck in the shirt', 'Add a belt')." 
      }
    },
    required: ["rating", "critique", "stylingTips"],
  };

  const prompt = `
    Act as a high-end fashion stylist.
    Rate the following outfit for a "${occasion}" occasion:
    Items: ${itemsDescription}
    
    Be honest but constructive. Give a score out of 10.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ratingSchema,
        temperature: 0.4,
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Error rating outfit:", error);
    throw error;
  }
};
