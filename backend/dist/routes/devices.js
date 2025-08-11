import express from 'express';
const router = express.Router();
// Minimal endpoint for Unity SDK compatibility
router.post('/', (req, res) => {
    // TODO: Implement device creation logic
    res.json({ success: true, message: 'Device created (stub)' });
});
export default router;
