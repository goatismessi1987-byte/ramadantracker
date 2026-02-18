
import { GoogleGenAI, Type } from "@google/genai";
import { QuranVerse } from "../types";

export const fetchDailyVerse = async (): Promise<QuranVerse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a beautiful and motivational Quranic verse related to fasting, prayer, sabr (patience), or reward during Ramadan. Return it in Arabic, Bengali, and English with its reference.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            arabic: { type: Type.STRING },
            bengali: { type: Type.STRING },
            english: { type: Type.STRING },
            reference: { type: Type.STRING }
          },
          required: ["arabic", "bengali", "english", "reference"]
        }
      }
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as QuranVerse;
  } catch (error) {
    console.error("Error fetching daily verse:", error);
    // Fallback verse
    return {
      arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ",
      bengali: "হে মুমিনগণ, তোমাদের ওপর রোজা ফরজ করা হয়েছে।",
      english: "O you who have believed, decreed upon you is fasting.",
      reference: "Surah Al-Baqarah, 2:183"
    };
  }
};
