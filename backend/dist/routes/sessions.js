import express from 'express';
import Session from '../models/Session.js';
import Game from '../models/Game.js';
import { compareVersions } from '../utils/versionUtils.js';
const router = express.Router();
// Minimal endpoint for Unity SDK compatibility
router.post('/', (req, res) => {
    // TODO: Implement session creation logic
    res.json({ success: true, message: 'Session created (stub)' });
});
router.post('/end', async (req, res) => {
    try {
        const { session_id, end_time, duration_seconds, game_version, timezone_offset_minutes } = req.body;
        console.log('[DEBUG] /api/sessions/end çağrıldı:', { session_id, end_time, duration_seconds, game_version, timezone_offset_minutes });
        // Veritabanındaki tüm sessionId'leri logla (ilk 10)
        const allSessions = await Session.findAll({ attributes: ['sessionId'], limit: 10 });
        console.log('[DEBUG] Veritabanındaki ilk 10 sessionId:', allSessions.map(s => s.sessionId));
        if (!session_id || !end_time || duration_seconds === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields: session_id, end_time, duration_seconds' });
        }
        // Parse duration as integer (round if float)
        let durationInt = parseInt(duration_seconds);
        if (isNaN(durationInt)) {
            durationInt = Math.round(Number(duration_seconds));
        }
        if (isNaN(durationInt)) {
            return res.status(400).json({ success: false, message: 'Invalid duration_seconds value' });
        }
        // Find session by sessionId
        const session = await Session.findOne({ where: { sessionId: session_id } });
        if (!session) {
            console.warn(`[WARN] Session end: session bulunamadı, session_id=${session_id}. 200 OK dönülüyor.`);
            return res.status(200).json({ success: false, message: 'Session not found, ignored' });
        }
        // Update session fields
        session.endTime = new Date(end_time);
        session.durationSeconds = durationInt;
        if (game_version)
            session.gameVersion = game_version;
        if (timezone_offset_minutes !== undefined)
            session.timezoneOffsetMinutes = timezone_offset_minutes;
        await session.save();
        // games.gameVersion güncellemesi
        if (session.gameVersion) {
            const game = await Game.findOne({ where: { id: session.gameId } });
            if (game) {
                if (!game.gameVersion || compareVersions(session.gameVersion, game.gameVersion) > 0) {
                    await game.update({ gameVersion: session.gameVersion });
                    console.log(`[UPDATE] games.gameVersion güncellendi: gameId=${game.id}, eski=${game.gameVersion}, yeni=${session.gameVersion}`);
                }
                else {
                    console.log(`[SKIP] games.gameVersion update atlanıyor: gameId=${game.id}, mevcut=${game.gameVersion}, session.gameVersion=${session.gameVersion}`);
                }
            }
            else {
                console.log(`[WARN] games tablosunda game bulunamadı: gameId=${session.gameId}`);
            }
        }
        return res.json({ success: true, message: 'Session ended and updated', sessionId: session_id });
    }
    catch (err) {
        console.error('Error in /api/sessions/end:', err);
        return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
    }
});
export default router;
