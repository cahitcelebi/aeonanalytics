const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
const PORT = process.env.PORT || 3001;

// CORS ayarları - frontend'in adresini burada belirtin
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf.toString());
        } catch (e) {
            console.error('Invalid JSON in request body:', e);
            res.status(400).json({ message: 'Invalid JSON format' });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.method === 'POST' && req.body) {
        const bodySize = JSON.stringify(req.body).length;
        console.log(`Request body size: ${bodySize} bytes`);
        if (bodySize < 1000) {
            console.log('Request body:', JSON.stringify(req.body, null, 2));
        } else {
            console.log('Request body (truncated):', JSON.stringify(req.body, null, 2).substring(0, 500) + '...');
        }
    }
    next();
});
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON in request body' });
    }
    next(err);
});

app.get('/api/test', (req, res) => {
    console.log("Test endpoint hit!");
    res.json({ 
        message: "Server is running with core middleware!",
        timestamp: new Date().toISOString(),
        env: {
            database: process.env.DATABASE_URL ? 'configured' : 'not configured'
        }
    });
});

// API rotaları
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);
const gameRoutes = require('./routes/games');
app.use('/api/games', gameRoutes);
const metricsRoutes = require('./routes/metrics');
app.use('/api/metrics', metricsRoutes);

// Global hata yakalama
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 