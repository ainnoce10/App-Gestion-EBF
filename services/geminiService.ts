
import { GoogleGenAI, Type } from "@google/genai";
import { DailyReport } from "../types";

// Always initialize GoogleGenAI with a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function processVoiceReport(base64Audio: string, mimeType: string): Promise<Partial<DailyReport>> {
  try {
    // Correct usage of generateContent with model and contents in the same object.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyse ce rapport vocal de technicien EBF (Electricité, Bâtiment, Froid) et extrais les informations structurées suivantes en JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            technicianName: { type: Type.STRING },
            content: { type: Type.STRING },
            domain: { type: Type.STRING, description: "Electricité, Froid, Bâtiment ou Plomberie" },
            interventionType: { type: Type.STRING },
            revenue: { type: Type.NUMBER },
            expenses: { type: Type.NUMBER },
            location: { type: Type.STRING },
            clientName: { type: Type.STRING },
            clientPhone: { type: Type.STRING },
          },
          required: ["content", "domain"],
        },
      },
    });

    // response.text is a getter property, not a method.
    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
    throw new Error("Impossible d'extraire les données du rapport");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
