import { GoogleGenAI } from "@google/genai";
import { Plant, Zombie } from "../types";
import { PLANT_CONFIGS } from "../constants";

// Initialize the client securely using the environment variable.
// We assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCrazyDaveAdvice = async (
  sun: number,
  plants: Plant[],
  zombies: Zombie[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Mumble mumble... (Missing API Key!)";
  }

  try {
    const plantSummary = plants.map(p => p.type).join(', ');
    const zombieSummary = zombies.map(z => z.type).join(', ');
    const availablePlants = Object.values(PLANT_CONFIGS).map(p => `${p.name} (${p.cost} sun)`).join(', ');

    const prompt = `
      You are Crazy Dave from Plants vs. Zombies. 
      Speak in your chaotic, slightly nonsensical but helpful style.
      
      Current Game State:
      - Sun Available: ${sun}
      - Plants on lawn: ${plantSummary || 'None'}
      - Zombies attacking: ${zombieSummary || 'None'}
      - Available seeds: ${availablePlants}
      
      Give me a ONE sentence strategic tip on what to plant next or how to survive. 
      Keep it short and crazy.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Wibble wobble! Plant more!";
  } catch (error) {
    console.error("Crazy Dave is confused:", error);
    return "Brains...? No, wait, plants! (AI Error)";
  }
};
