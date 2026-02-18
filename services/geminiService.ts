
import { GoogleGenAI, Type } from "@google/genai";
import { QuranVerse } from "../types";

const STATIC_VERSES: QuranVerse[] = [
  {
    arabic: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ",
    bengali: "হে মুমিনগণ, তোমাদের ওপর রোজা ফরজ করা হয়েছে, যেমন ফরজ করা হয়েছিল তোমাদের পূর্ববর্তীদের ওপর; যাতে তোমরা তাকওয়া অর্জন করতে পারো।",
    english: "O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous.",
    reference: "Surah Al-Baqarah, 2:183"
  },
  {
    arabic: "شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ هُدًى لِّلنَّاسِ وَبَيِّنَاتٍ مِّنَ الْهُدَىٰ وَالْفُرْقَانِ",
    bengali: "রমজান মাসই হলো সেই মাস, যাতে নাজিল করা হয়েছে কুরআন, যা মানুষের জন্য হেদায়েত এবং সত্যপথযাত্রীদের জন্য সুষ্পষ্ট পথনির্দেশ।",
    english: "The month of Ramadhan [is that] in which was revealed the Qur'an, a guidance for the people and clear proofs of guidance and criterion.",
    reference: "Surah Al-Baqarah, 2:185"
  },
  {
    arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
    bengali: "আর যখন আমার বান্দারা আমার সম্পর্কে আপনাকে জিজ্ঞেস করে, তখন বলে দিন যে, নিশ্চয়ই আমি তাদের কাছেই আছি। আমি প্রার্থনাকারীর প্রার্থনা কবুল করি যখন সে আমার কাছে প্রার্থনা করে।",
    english: "And when My servants ask you, [O Muhammad], concerning Me - indeed I am near. I respond to the invocation of the supplicant when he calls upon Me.",
    reference: "Surah Al-Baqarah, 2:186"
  },
  {
    arabic: "وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ",
    bengali: "আর তোমরা পাথেয় সংগ্রহ কর, নিশ্চয়ই শ্রেষ্ঠ পাথেয় হলো আল্লাহর ভয় (তাকওয়া)।",
    english: "And take provisions, but indeed, the best provision is fear of Allah.",
    reference: "Surah Ibrahim, 14:7"
  },
  {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    bengali: "নিশ্চয়ই কষ্টের সাথেই সুখ রয়েছে।",
    english: "Indeed, with hardship [will be] ease.",
    reference: "Surah Al-Inshirah, 94:6"
  },
  {
    arabic: "لَّئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    bengali: "যদি তোমরা কৃতজ্ঞতা স্বীকার কর, তবে আমি তোমাদেরকে আরও দেব।",
    english: "If you are grateful, I will surely increase you [in favor].",
    reference: "Surah Ibrahim, 14:7"
  },
  {
    arabic: "فَاصْبِرْ صَبْرًا جَمِيلًا",
    bengali: "অতএব আপনি উত্তম ধৈর্য ধারণ করুন।",
    english: "So be patient with gracious patience.",
    reference: "Surah Al-Ma'arij, 70:5"
  },
  {
    arabic: "ادْعُونِي أَسْتَجِبْ لَكُمْ",
    bengali: "তোমরা আমাকে ডাকো, আমি তোমাদের ডাকে সাড়া দেব।",
    english: "Call upon Me; I will respond to you.",
    reference: "Surah Ghafir, 40:60"
  },
  {
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    bengali: "নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।",
    english: "Indeed, Allah is with the patient.",
    reference: "Surah Al-Baqarah, 2:153"
  }
];

export const fetchDailyVerse = async (): Promise<QuranVerse> => {
  const randomStatic = STATIC_VERSES[Math.floor(Math.random() * STATIC_VERSES.length)];
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a unique motivational Quranic verse for Ramadan. Format: JSON with arabic, bengali, english, reference. Ensure the bengali is poetic.",
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
    console.warn("Gemini fetch failed, using static fallback:", error);
    return randomStatic;
  }
};

export const getRandomStaticVerse = (): QuranVerse => {
  return STATIC_VERSES[Math.floor(Math.random() * STATIC_VERSES.length)];
};
