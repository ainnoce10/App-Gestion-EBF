
import { GoogleGenAI } from "@google/genai";
import { StatData, DailyReport } from '../types';

/**
 * Analyse les données financières via Gemini Flash
 */
export const analyzeBusinessData = async (data: StatData[], site: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    En tant qu'expert en business intelligence pour l'entreprise EBF, analyse ces données financières pour le site ${site} :
    Données: ${JSON.stringify(data)}
    Donne un résumé percutant (max 50 mots) sur la santé financière actuelle et une recommandation stratégique.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini failed", error);
    return "L'IA n'a pas pu générer l'analyse. Vérifiez la configuration de l'API.";
  }
};

/**
 * Synthétise les rapports techniques
 */
export const analyzeReports = async (reports: DailyReport[], period: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    En tant que superviseur technique EBF, synthétise ces rapports de techniciens pour la période ${period} :
    Rapports: ${JSON.stringify(reports)}
    Fais un résumé structuré des travaux majeurs accomplis et des points de blocage ou besoins urgents signalés.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Synthèse indisponible.";
  } catch (error) {
    console.error("Gemini failed", error);
    return "Erreur lors de la synthèse des rapports par l'IA.";
  }
};
