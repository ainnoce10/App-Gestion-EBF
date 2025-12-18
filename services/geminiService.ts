
import { GoogleGenAI, Type } from "@google/genai";
import { StatData, DailyReport } from '../types';

/**
 * Analyse les données financières globales via Gemini.
 */
export const analyzeBusinessData = async (data: StatData[], site: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Tu es un expert en business intelligence pour l'entreprise EBF (Electricité-Bâtiment-Froid).
    Analyse les données suivantes pour le site : ${site}.
    Donne un résumé court, percutant et professionnel (max 50 mots) sur la santé financière et l'activité.
    Utilise un ton encourageant ou d'avertissement selon les chiffres.
    
    Données: ${JSON.stringify(data)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Gemini analysis failed", error);
    return "Erreur lors de l'analyse des données.";
  }
};

/**
 * Synthétise les rapports techniques journaliers via Gemini.
 */
export const analyzeReports = async (reports: DailyReport[], period: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Synthèse indisponible.";
  } catch (error) {
    console.error("Gemini report analysis failed", error);
    return "Erreur lors de l'analyse des rapports.";
  }
};

/**
 * Transcrit et structure un rapport vocal d'intervention.
 */
export const processVoiceReport = async (base64Audio: string, mimeType: string): Promise<Partial<DailyReport>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Tu es un assistant de saisie pour l'entreprise EBF (Electricité, Bâtiment, Froid).
    Analyse cet enregistrement audio d'un technicien qui fait son rapport de fin de journée.
    Extrais les informations et retourne un objet JSON structuré.
    
    Format de réponse attendu (JSON uniquement) :
    {
      "technicianName": "Nom extrait",
      "content": "Résumé clair et professionnel de l'intervention",
      "domain": "Electricité" | "Froid" | "Bâtiment" | "Plomberie",
      "interventionType": "Type d'intervention",
      "expenses": 1234,
      "revenue": 5678,
      "clientName": "Nom du client",
      "location": "Lieu de l'intervention",
      "rating": 5
    }
    
    Si une information est manquante, mets null. Pour le domaine, choisis la catégorie la plus proche.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { inlineData: { data: base64Audio, mimeType: mimeType } },
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Gemini voice processing failed", error);
    throw new Error("Impossible d'analyser le rapport vocal.");
  }
};
