import { GoogleGenAI } from "@google/genai";
import { StatData, DailyReport } from '../types';

export const analyzeBusinessData = async (data: StatData[], site: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return "Clé API manquante ou invalide.";
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Tu es un expert en business intelligence pour l'entreprise EBF.
    Analyse les données suivantes pour le site : ${site}.
    Donne un résumé court, percutant et professionnel (max 50 mots) sur la santé financière et l'activité.
    Utilise un ton encourageant ou d'avertissement selon les chiffres.
    
    Données: ${JSON.stringify(data)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Erreur lors de l'analyse des données (Vérifiez les quotas API).";
  }
};

export const analyzeReports = async (reports: DailyReport[], period: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Clé API manquante.";

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Tu es le superviseur technique de EBF. Voici les rapports des techniciens pour la période : ${period}.
    Fais une synthèse structurée en 3 points :
    1. Travaux accomplis majeurs.
    2. Problèmes ou blocages signalés (Urgent).
    3. Besoins en matériel.

    Rapports : ${JSON.stringify(reports)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Synthèse indisponible.";
  } catch (error) {
    console.error("Gemini report analysis failed", error);
    return "Erreur lors de l'analyse des rapports.";
  }
};