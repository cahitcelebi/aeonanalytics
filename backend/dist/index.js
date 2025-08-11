import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import gamesRoutes from './routes/games.js';
import metricsRouter from './routes/metrics.js';
import eventsRouter from './routes/events.js';
import sessionsRouter from './routes/sessions.js';
import playersRouter from './routes/players.js';
import devicesRouter from './routes/devices.js';
import chatRoutes from './routes/chat.js';
import './models/Developer.js';
import './models/Session.js';
import './models/Event.js';
// Load environment variables
dotenv.config();
const app = express();
const PORT = 3001;
console.log('DEBUG PORT VALUE:', process.env.PORT);
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/metrics/dashboard', dashboardRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/metrics', metricsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/players', playersRouter);
app.use('/api/devices', devicesRouter);
app.use('/api', chatRoutes);
// Database connection
sequelize.authenticate()
    .then(() => {
    console.log('Database connection has been established successfully.');
    return sequelize.sync();
})
    .then(() => {
    console.log('Database models synchronized.');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error('Unable to connect to the database:', error);
});
