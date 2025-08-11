import express from 'express';
const router = express.Router();
// Minimal endpoint for Unity SDK compatibility
router.post('/', (req, res) => {
    // TODO: Implement player creation logic
    res.json({ success: true, message: 'Player created (stub)' });
});
export default router;
