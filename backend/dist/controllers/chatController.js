import { SYSTEM_PROMPT, startGeminiChat } from '../services/geminiService.js';
import Game from '../models/Game.js';
// In-memory chat history (production'da Redis kullanılabilir)
const chatHistories = {};
export class ChatController {
    async handleChatMessage(req, res) {
        try {
            const { message, sessionId, gameId, pageContext } = req.body;
            console.log('[CHAT API] Request:', { message, sessionId, gameId, pageContext });
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' });
            }
            // Session history'yi başlat
            if (!chatHistories[sessionId]) {
                chatHistories[sessionId] = [
                    { role: 'user', parts: [{ text: SYSTEM_PROMPT }] }
                ];
            }
            let contextualMessage = message;
            if (gameId) {
                // Oyun bilgilerini çek
                const game = await Game.findOne({ where: { id: gameId } });
                if (game) {
                    contextualMessage = `You are currently on the dashboard of the game '${game.name}' (platform: ${game.platform || 'unknown'}). Description: ${game.description || 'N/A'}. User question: ${message}`;
                }
                else {
                    contextualMessage = `You are currently on the dashboard of a game with ID ${gameId}. User question: ${message}`;
                }
            }
            // Chat session'ı başlat ve Gemini'den yanıt al
            const textResponse = await startGeminiChat({
                history: chatHistories[sessionId],
                message: contextualMessage
            });
            // History'yi güncelle
            chatHistories[sessionId].push({ role: 'user', parts: [{ text: contextualMessage }] });
            chatHistories[sessionId].push({ role: 'model', parts: [{ text: textResponse }] });
            return res.json({
                type: 'conversation',
                message: textResponse,
                suggestions: this.generateGeneralSuggestions()
            });
        }
        catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            // Hata logu için request parametrelerini tekrar al
            const { message, sessionId, gameId, pageContext } = req.body || {};
            console.error('Chat Error:', {
                error,
                message,
                sessionId,
                gameId,
                pageContext,
                stack: error instanceof Error ? error.stack : undefined
            });
            console.log('Chat Error:', {
                error,
                message,
                sessionId,
                gameId,
                pageContext,
                stack: error instanceof Error ? error.stack : undefined
            });
            res.status(500).json({
                type: 'error',
                message: 'Sorry, an error occurred. Please try again.',
                error: errMsg
            });
        }
    }
    generateSuggestions(data, functionName) {
        const suggestions = [];
        switch (functionName) {
            case 'getGameMetrics':
                suggestions.push('Bu oyunun retention verilerini göster');
                suggestions.push('Gelir analizini detaylandır');
                suggestions.push('Kullanıcı segmentasyonunu incele');
                break;
            case 'getRetentionData':
                suggestions.push('Gelir metrikleriyle karşılaştır');
                suggestions.push('Performans verilerini kontrol et');
                suggestions.push('Kullanıcı davranışlarını analiz et');
                break;
            case 'getRevenueAnalytics':
                suggestions.push('Retention ile karşılaştır');
                suggestions.push('ARPU trendini göster');
                suggestions.push('Conversion rate analizi yap');
                break;
            case 'getUserSegments':
                suggestions.push('Segment bazlı gelir analizi');
                suggestions.push('En aktif kullanıcıları göster');
                suggestions.push('Coğrafi dağılımı incele');
                break;
            case 'getPerformanceMetrics':
                suggestions.push('Crash rate trendini göster');
                suggestions.push('Error analizini detaylandır');
                suggestions.push('Performans iyileştirme önerileri');
                break;
        }
        return suggestions;
    }
    generateGeneralSuggestions() {
        return [
            'Show the overall performance of this game',
            'Get metrics for the last 30 days',
            'Analyze user retention',
            'Show revenue trend',
            'Show the most popular features'
        ];
    }
    // Chat history'yi temizle
    async clearHistory(req, res) {
        try {
            const { sessionId } = req.body;
            if (sessionId && chatHistories[sessionId]) {
                delete chatHistories[sessionId];
            }
            res.json({ success: true, message: 'Chat history cleared' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to clear history' });
        }
    }
    // Chat health check
    async healthCheck(req, res) {
        res.json({
            status: 'OK',
            service: 'AeonAnalytic Chat Service',
            timestamp: new Date().toISOString()
        });
    }
}
