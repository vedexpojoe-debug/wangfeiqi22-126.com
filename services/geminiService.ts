
import { GoogleGenAI, Type } from "@google/genai";
import { WasteAnalysisResult, WasteType, RecycledProductType, MediaType, LaborServiceType, CollectionMethod } from "../types";

// Helper to clean potential markdown wrapping around JSON
const cleanJsonString = (str: string): string => {
  if (!str) return "";
  // Remove markdown code blocks if present
  let clean = str.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

// Recommendation: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWasteMedia = async (base64Data: string, mediaType: MediaType, mimeType: string): Promise<WasteAnalysisResult> => {
  try {
    const ai = getAiClient();
    // Robustly clean base64 string
    // If it's a data URL, split it. If it's raw, use as is.
    const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    const prompt = `
      Analyze this ${mediaType.toLowerCase()} of waste/trash for a waste removal service.
      
      1. Identify the primary category among these three main types:
         - CONSTRUCTION (Main): Bricks, concrete, tiles, drywall, renovation debris, broken wood, pipes.
         - BULKY (Main): Furniture, mattresses, sofas, large appliances, tables, chairs.
         - GARDEN (Main): Branches, leaves, grass, soil, trees, organic yard waste.
         
         * Use the following only if it strictly matches and is NOT one of the above:
         - HAZARDOUS: Paints, chemicals, batteries.
         - GENERAL: Mixed household waste, small plastic bags.
         - RECYCLABLE: Pure cardboard piles, scrap metal piles.
         - ELECTRONIC: Computers, TVs.
      
      2. Estimate weight (kg) and visual volume (e.g. "2 bags", "0.5m3").
      3. Estimate disposal cost in CNY.
      4. Describe the waste.
      5. Recommend vehicle (Pickup, Dump Truck, Van).
      6. CHECK CONDITION:
         - Is the waste currently inside bags? (isBagged)
         - Is the waste gathered in a single pile/location? (isCollected)
      7. SERVICE RECOMMENDATION (LABOR):
         - If it looks scattered or indoors requiring carrying: "CARRY_AND_LOAD"
         - If it's curbside/piled but needs lifting: "LOADING_ONLY"
         - If it looks like it can be driven up to directly: "NONE" (or imply simple loading)
      8. Safety warnings if hazardous.
      9. COLLECTION METHOD:
         - If volume > 2m3, loose renovation waste, or scattered: "CONTAINER" (Suggestion to place a collection box).
         - Otherwise: "IMMEDIATE" (Load and go).
    `;

    // Updated model to gemini-3-flash-preview as per the latest guidelines for general multimodal tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Content
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wasteType: {
              type: Type.STRING,
              enum: ["GENERAL", "CONSTRUCTION", "HAZARDOUS", "RECYCLABLE", "ORGANIC", "ELECTRONIC", "BULKY", "GARDEN", "UNKNOWN"]
            },
            estimatedWeightKg: { type: Type.NUMBER },
            estimatedVolume: { type: Type.STRING },
            estimatedPrice: { type: Type.NUMBER },
            description: { type: Type.STRING },
            recommendedVehicle: { type: Type.STRING },
            hazardWarning: { type: Type.STRING },
            isBagged: { type: Type.BOOLEAN },
            isCollected: { type: Type.BOOLEAN },
            laborServiceRecommendation: { 
              type: Type.STRING,
              enum: ["NONE", "LOADING_ONLY", "CARRY_AND_LOAD"]
            },
            recommendedCollectionMethod: {
              type: Type.STRING,
              enum: ["IMMEDIATE", "CONTAINER"]
            }
          },
          required: ["wasteType", "estimatedWeightKg", "estimatedVolume", "estimatedPrice", "description", "recommendedVehicle", "isBagged", "isCollected", "laborServiceRecommendation", "recommendedCollectionMethod"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const cleanText = cleanJsonString(text);
    const analysis = JSON.parse(cleanText) as WasteAnalysisResult;
    
    return analysis;

  } catch (error) {
    console.error("Error analyzing waste:", error);
    // Fixed: Use enum values instead of strings
    return {
      wasteType: WasteType.UNKNOWN,
      estimatedWeightKg: 10,
      estimatedVolume: "Unknown",
      estimatedPrice: 20,
      description: "Failed to analyze media. Please describe manually.",
      recommendedVehicle: "Standard Truck",
      isBagged: false,
      isCollected: true,
      laborServiceRecommendation: LaborServiceType.LOADING_ONLY,
      recommendedCollectionMethod: CollectionMethod.IMMEDIATE
    };
  }
};

export const analyzeRecycledProduct = async (base64Image: string): Promise<{ type: RecycledProductType; quantity: string; estimatedValue: number }> => {
  try {
    const ai = getAiClient();
    let mimeType = 'image/jpeg';
    let cleanBase64 = base64Image;

    // Robust extraction for recycled product too
    if (base64Image.includes(',')) {
        const parts = base64Image.split(',');
        cleanBase64 = parts[1];
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) {
            mimeType = mimeMatch[1];
        }
    }

    const prompt = `
      Analyze this image of recycled material/commodities at a processing facility.
      Identify the material type from the following categories:
      - Stone Powder (石粉)
      - Gravel/Aggregate (石子/骨料)
      - Scrap Iron/Metal (废铁)
      - Wood/Timber (木材)
      - Plastic (塑料)
      - Glass (玻璃)
      - Light Material (轻物质)
      
      Estimate the quantity seen in the image (e.g., "50 tons", "500kg").
      Estimate a rough market value or stock value in CNY.
    `;

    // Updated model to gemini-3-flash-preview
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ["STONE_POWDER", "GRAVEL", "LIGHT_MATERIAL", "SCRAP_IRON", "WOOD", "PLASTIC", "GLASS", "OTHER"]
            },
            quantity: { type: Type.STRING },
            estimatedValue: { type: Type.NUMBER }
          },
          required: ["type", "quantity", "estimatedValue"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    const cleanText = cleanJsonString(text);
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Error analyzing recycled product:", error);
    return {
      type: RecycledProductType.OTHER,
      quantity: "Unknown",
      estimatedValue: 0
    };
  }
};

// NEW: Chat with Copilot
export const chatWithCopilot = async (userMessage: string, userRole: string, contextSummary: string): Promise<{ reply: string; action?: string }> => {
    try {
        const ai = getAiClient();
        const prompt = `
            You are "Eco-Brain", the AI Copilot for the EcoClear waste management platform.
            Current User Role: ${userRole}.
            Context Summary: ${contextSummary}.

            Your goal is to help the user navigate the app, understand data, or perform actions.
            
            Response Instructions:
            1. Keep answers concise, friendly, and professional (in Chinese).
            2. If the user asks to go somewhere, return an 'action' field with the navigation target.
            3. If the user asks about data (e.g., "How much waste?"), use the Context Summary to answer.
            
            Available Actions (return in 'action' field if applicable):
            - NAVIGATE:MARKET (Go to marketplace)
            - NAVIGATE:DASHBOARD (Go to main dashboard)
            - NAVIGATE:PROFILE (Go to settings)
            - CREATE:ORDER (Start a new order flow)
            
            User Query: "${userMessage}"
        `;

        // Updated model to gemini-3-pro-preview for Copilot chat tasks as it requires better reasoning
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        reply: { type: Type.STRING },
                        action: { type: Type.STRING, enum: ["NAVIGATE:MARKET", "NAVIGATE:DASHBOARD", "NAVIGATE:PROFILE", "CREATE:ORDER"] }
                    },
                    required: ["reply"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        return JSON.parse(cleanJsonString(text));

    } catch (error) {
        console.error("Copilot Error:", error);
        return { reply: "系统繁忙，请稍后再试。(AI Busy)" };
    }
};
