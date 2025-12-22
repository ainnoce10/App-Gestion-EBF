
import { GoogleGenAI } from "@google/genai";
import { StatData, DailyReport } from '../types';

/**
 * Fix: Ensure strict adherence to Gemini API SDK guidelines.
 * Uses process.env.API_KEY and gemini-3-flash-preview for text tasks.
 */
export const analyzeBusinessData = async (data: StatData[], site: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    En tant qu'expert en business intelligence pour EBF, analyse ces données financières pour le site ${site} :
    Données: ${JSON.stringify(data)}
    Donne un résumé percutant (max 50 mots) sur la santé financière actuelle.
  `;

  try {
    // Fix: Use prompt string directly for contents parameter
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access text via property (already correct in original, kept for consistency)
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini failed", error);
    return "L'IA n'a pas pu générer l'analyse.";
  }
};

export const analyzeReports = async (reports: DailyReport[], period: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Synthétise ces rapports de techniciens pour la période ${period} :
    Rapports: ${JSON.stringify(reports)}
    Fais un résumé structuré des travaux majeurs et des points de blocage.
  `;

  try {
    // Fix: Simplified contents payload as per latest @google/genai best practices
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Synthèse indisponible.";
  } catch (error) {
    console.error("Gemini failed", error);
    return "Erreur lors de la synthèse.";
  }
};
