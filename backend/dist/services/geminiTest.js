import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function main() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash", // veya "gemini-2.5-flash"
            contents: "Test: Merhaba Gemini! Bana kısa bir yanıt ver."
        });
        console.log("Gemini API yanıtı:", response.text ?? "(yanıt yok)");
    }
    catch (e) {
        console.error("Gemini API Hatası:", e);
    }
}
main();
