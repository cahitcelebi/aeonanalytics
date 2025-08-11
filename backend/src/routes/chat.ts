import { Router } from 'express';
import { ChatController } from '../controllers/chatController.js';

const router = Router();
const chatController = new ChatController();

// Chat mesajlarını işle
router.post('/chat', chatController.handleChatMessage.bind(chatController));

// Chat history'yi temizle
router.delete('/chat/history', chatController.clearHistory.bind(chatController));

// Health check
router.get('/chat/health', chatController.healthCheck.bind(chatController));

export default router; 