import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import Game from '../models/Game.js'; // gameId düzeltmesi için
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not defined in environment variables. Chatbot functionality will be disabled.");
}
export const SYSTEM_PROMPT = `IMPORTANT: Never generate example, illustrative, or made-up data! Only use the actual data from the function response. If there is no function response, reply: 'Sorry, no data could be retrieved for your request. Please ask a more specific metric question or contact your system administrator.'

Default language is English. Always answer in the user's language if you can detect it from the question; otherwise, answer in English.

You have access to the following game analytics metrics:
- Daily Active Users (DAU), Weekly Active Users (WAU), Monthly Active Users (MAU), New Users, Session Count, Average Session Duration, Average Sessions per User, Retention (Day 1/7/30), Churn Rate, Total Revenue, ARPU, ARPPU, Conversion Rate, LTV, Purchase Count, Crash Rate, Error Rate, Event Trends, Revenue Trends, Retention Trends, User Segments, Device/Platform/Version breakdowns, and more.

When you receive a function response, always extract and present all relevant metrics in a clear table or bullet list, with actual numbers and units. If the user asks a general question (e.g. "How is my game doing?"), show a summary table with all key metrics. If the user asks about a specific metric or trend, show the relevant numbers and trends. Never ask the user for data you already have (e.g. date range, gameId, version, platform, etc.). Always use the data in the function response to answer as fully and informatively as possible.

---

EXAMPLES:
- If the user says: "Show revenue trend" or "How much money did my game make?" → Call getRevenueAnalytics
- If the user says: "Analyze user retention" or "What is my day 7 retention?" → Call getRetentionData
- If the user says: "Show the overall performance of this game" or "Give me a summary of all metrics" → Call getGameMetrics
- If the user says: "Show user segments" or "Breakdown by country" → Call getUserSegments
- If the user says: "Show crash rate" or "Analyze performance issues" → Call getPerformanceMetrics

Always call the most relevant function for the user's question. If in doubt, prefer getGameMetrics for general questions.

NOTE: You may receive gameId as a name, apiKey, or numeric id. Always resolve to the numeric id before calling the API.`;
export const ai = new GoogleGenAI({ apiKey: API_KEY });
// Fonksiyon tanımları Gemini'ye uygun şekilde
const functionDeclarations = [
    {
        name: "getGameMetrics",
        description: "Get overall game metrics summary for a specific game. Use for general performance, summary, or overview questions. Example triggers: 'overall performance', 'summary', 'all metrics', 'how is my game doing', 'dashboard overview'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                gameId: { type: Type.STRING, description: "Game ID" },
                startDate: { type: Type.STRING, description: "Start date (YYYY-MM-DD). If not provided and user says 'last 30 days', 'last week', etc., calculate automatically." },
                endDate: { type: Type.STRING, description: "End date (YYYY-MM-DD). If not provided and user says 'last 30 days', 'last week', etc., calculate automatically." }
            },
            required: ["gameId"]
        }
    },
    {
        name: "getRetentionData",
        description: "Get retention data for a specific game. Use for retention, day 1/7/30 retention, cohort, or user return questions. Example triggers: 'retention', 'day 7 retention', 'user return', 'cohort'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                gameId: { type: Type.STRING, description: "Game ID" },
                period: { type: Type.STRING, description: "Retention period (e.g. 7d, 30d). If not provided and user says '7 days', '30 days', etc., use that period." }
            },
            required: ["gameId"]
        }
    },
    {
        name: "getRevenueAnalytics",
        description: "Get revenue analytics for a specific game. Use for revenue, ARPU, ARPPU, monetization, or trend questions. Example triggers: 'revenue', 'ARPU', 'ARPPU', 'monetization', 'revenue trend', 'income', 'earnings'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                gameId: { type: Type.STRING, description: "Game ID" },
                startDate: { type: Type.STRING, description: "Start date (YYYY-MM-DD)", nullable: true },
                endDate: { type: Type.STRING, description: "End date (YYYY-MM-DD)", nullable: true }
            },
            required: ["gameId"]
        }
    },
    {
        name: "getUserSegments",
        description: "Get user segment analysis for a specific game. Use for segment, country, platform, device, or demographic breakdown questions. Example triggers: 'user segments', 'country breakdown', 'platform breakdown', 'device breakdown', 'demographics'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                gameId: { type: Type.STRING, description: "Game ID" }
            },
            required: ["gameId"]
        }
    },
    {
        name: "getPerformanceMetrics",
        description: "Get performance metrics for a specific game. Use for crash rate, error rate, performance, or stability questions. Example triggers: 'crash rate', 'error rate', 'performance', 'stability', 'crash trend', 'error trend'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                gameId: { type: Type.STRING, description: "Game ID" }
            },
            required: ["gameId"]
        }
    }
];
async function resolveGameId(gameId) {
    if (!gameId)
        return gameId;
    if (!isNaN(Number(gameId)))
        return String(gameId); // already numeric
    // Try to find by apiKey or name
    const game = await Game.findOne({ where: { apiKey: gameId } }) || await Game.findOne({ where: { name: gameId } });
    if (game)
        return String(game.id);
    return gameId; // fallback, may error in API
}
// Fonksiyonel API endpoint çağrıları
export const availableFunctions = {
    getGameMetrics: async ({ gameId, startDate, endDate }) => {
        gameId = await resolveGameId(gameId);
        console.log(`Fonksiyon çağrıldı: getGameMetrics. Game ID: ${gameId}`);
        const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metrics/overview/${gameId}?startDate=${startDate || '2025-01-01'}&endDate=${endDate || new Date().toISOString().split('T')[0]}`);
        const data = await response.json();
        return {
            success: true,
            gameId: gameId,
            ...(data.summary || {})
        };
    },
    getRetentionData: async ({ gameId, period }) => {
        gameId = await resolveGameId(gameId);
        console.log(`Fonksiyon çağrıldı: getRetentionData. Game ID: ${gameId}, Period: ${period}`);
        const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metrics/engagement/${gameId}`);
        const data = await response.json();
        return {
            success: true,
            retention: data.retention,
            gameId: gameId
        };
    },
    getRevenueAnalytics: async ({ gameId, startDate, endDate }) => {
        gameId = await resolveGameId(gameId);
        console.log(`Fonksiyon çağrıldı: getRevenueAnalytics. Game ID: ${gameId}`);
        const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metrics/monetization/${gameId}?startDate=${startDate || '2025-01-01'}&endDate=${endDate || new Date().toISOString().split('T')[0]}`);
        const data = await response.json();
        return {
            success: true,
            revenue: data.summary,
            gameId: gameId
        };
    },
    getUserSegments: async ({ gameId }) => {
        gameId = await resolveGameId(gameId);
        console.log(`Fonksiyon çağrıldı: getUserSegments. Game ID: ${gameId}`);
        const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metrics/user-analysis/${gameId}`);
        const data = await response.json();
        return {
            success: true,
            segments: data.demographics,
            gameId: gameId
        };
    },
    getPerformanceMetrics: async ({ gameId }) => {
        gameId = await resolveGameId(gameId);
        console.log(`Fonksiyon çağrıldı: getPerformanceMetrics. Game ID: ${gameId}`);
        const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/metrics/performance/${gameId}`);
        const data = await response.json();
        return {
            success: true,
            performance: data,
            gameId: gameId
        };
    },
};
export async function startGeminiChat({ history, message, systemPrompt = SYSTEM_PROMPT, model = "gemini-1.5-flash" }) {
    if (!API_KEY) {
        return "Sorry, the chatbot service is currently unavailable. Please try again later.";
    }
    const fullHistory = history.length === 0
        ? [{ role: 'user', parts: [{ text: systemPrompt }] }]
        : [...history];
    fullHistory.push({ role: 'user', parts: [{ text: message }] });
    try {
        const response = await ai.models.generateContent({
            model,
            contents: fullHistory.map(h => {
                if (h.role === 'user' || h.role === 'model') {
                    return { role: h.role, parts: h.parts };
                }
                else if (h.role === 'function') {
                    return { role: 'function', parts: h.parts };
                }
                return h;
            }),
            config: { tools: [{ functionDeclarations }] }
        });
        // LOG: LLM'den dönen yanıt ve function call
        console.log('[GEMINI RAW RESPONSE]', JSON.stringify(response, null, 2));
        const functionCallPart = response.candidates?.[0]?.content?.parts?.find((p) => p.functionCall);
        if (functionCallPart) {
            console.log('[GEMINI FUNCTION CALL]', JSON.stringify(functionCallPart, null, 2));
        }
        if (functionCallPart && functionCallPart.functionCall?.name && availableFunctions[functionCallPart.functionCall.name]) {
            let args = functionCallPart.functionCall.args || {};
            if (args.gameId && typeof args.gameId === 'string' && isNaN(Number(args.gameId))) {
                const game = await Game.findOne({ where: { apiKey: args.gameId } });
                if (game)
                    args.gameId = String(game.id);
            }
            const result = await availableFunctions[functionCallPart.functionCall.name](args);
            const followup = await ai.models.generateContent({
                model,
                contents: [
                    ...fullHistory,
                    { role: 'model', parts: [functionCallPart] },
                    { role: 'function', parts: [
                            { functionResponse: { name: functionCallPart.functionCall.name, response: result } },
                            { text: `IMPORTANT: Only use the actual numbers and values from the function response below. Do NOT use example, placeholder, or made-up values. Present all available metrics and trends in a table or bullet list, using the exact numbers from the response. If the response contains summary, trends, or segment data, show them all in your answer. If a metric is missing, do not invent or estimate it.` }
                        ] }
                ],
                config: { tools: [{ functionDeclarations }] }
            });
            return followup.candidates?.[0]?.content?.parts?.map((p) => p.text).join(' ') ?? "";
        }
        return "Sorry, no data could be retrieved for your request. Please ask a more specific metric question or contact your system administrator.";
    }
    catch (error) {
        console.error('Gemini API Error:', error);
        return "Sorry, I am unable to respond at the moment. Please try again later.";
    }
}
