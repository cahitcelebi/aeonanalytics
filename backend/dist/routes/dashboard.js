import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();
// Tüm dashboard rotaları için kimlik doğrulama gerekli
router.use(authenticateToken);
router.get('/stats', async (req, res) => {
    try {
        // Burada gerçek verileri veritabanından çekebilirsiniz
        const stats = {
            totalUsers: 100,
            activeSessions: 25,
            totalEvents: 1000,
        };
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});
export default router;
