const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const Progression = require('../models/Progression');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Create a new progression record
 */
exports.createProgression = async (req, res) => {
    try {
        const { 
            user_id, 
            level_number, 
            level_name, 
            start_time, 
            completion_status, 
            score, 
            stars,
            timezone_offset_minutes,
            game_id 
        } = req.body;

        // Validate required fields
        if (!user_id || !level_number) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'user_id and level_number are required'
            });
        }

        // Calculate local timestamp (with error handling)
        let localStartTime;
        try {
            const startTimeDate = typeof start_time === 'string' ? new Date(start_time) : start_time;
            localStartTime = new Date(startTimeDate.getTime() - (timezone_offset_minutes * 60000));
            
            // Validate date
            if (isNaN(localStartTime.getTime())) {
                throw new Error("Invalid date");
            }
        } catch (error) {
            // Use current time in case of error
            console.error("Invalid timestamp received:", start_time);
            localStartTime = new Date();
        }

        const result = await Progression.create({
            user_id,
            level_number,
            level_name: level_name || `Level ${level_number}`,
            start_time: localStartTime,
            completion_status: completion_status || 'started',
            score,
            stars,
            game_id
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error in createProgression:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get progression data for a specific game
 */
exports.getProgressionByGame = async (req, res) => {
    try {
        const { limit = 100, offset = 0, startDate, endDate } = req.query;
        
        let whereClause = { 
            game_id: req.params.gameId
        };
        
        // Add date filters if provided
        if (startDate || endDate) {
            whereClause.start_time = {};
            
            if (startDate) {
                whereClause.start_time[Op.gte] = new Date(startDate);
            }
            
            if (endDate) {
                whereClause.start_time[Op.lte] = new Date(endDate);
            }
        }
        
        const progression = await Progression.findAll({ 
            where: whereClause,
            order: [['start_time', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        // Get total count for pagination
        const count = await Progression.count({ where: whereClause });
        
        res.json({
            progression,
            pagination: {
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error in getProgressionByGame:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get level completion metrics for a game
 */
exports.getLevelCompletionStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const gameId = req.params.gameId;
        
        // Build the time filter
        let timeFilter = '';
        const params = [gameId];
        
        if (startDate) {
            timeFilter += ' AND start_time >= $2';
            params.push(new Date(startDate));
        }
        
        if (endDate) {
            timeFilter += ` AND start_time <= $${params.length + 1}`;
            params.push(new Date(endDate));
        }
        
        const result = await pool.query(`
            SELECT 
                level_number,
                MAX(level_name) as level_name,
                SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN completion_status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN completion_status = 'started' THEN 1 ELSE 0 END) as started_count,
                AVG(score) as avg_score,
                AVG(stars) as avg_stars,
                AVG(attempts) as avg_attempts,
                SUM(CASE WHEN completion_status = 'completed' THEN 1 ELSE 0 END)::float / 
                NULLIF(COUNT(*), 0) as completion_rate
            FROM progression 
            WHERE game_id = $1${timeFilter}
            GROUP BY level_number 
            ORDER BY level_number
        `, params);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getLevelCompletionStats:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update a progression record when level is completed
 */
exports.updateProgression = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            end_time, 
            completion_status, 
            score, 
            stars, 
            attempts 
        } = req.body;
        
        const progression = await Progression.findByPk(id);
        
        if (!progression) {
            return res.status(404).json({ message: 'Progression record not found' });
        }
        
        // Update the fields
        if (end_time) progression.end_time = new Date(end_time);
        if (completion_status) progression.completion_status = completion_status;
        if (score !== undefined) progression.score = score;
        if (stars !== undefined) progression.stars = stars;
        if (attempts !== undefined) progression.attempts = attempts;
        
        await progression.save();
        
        res.json(progression);
    } catch (error) {
        console.error('Error in updateProgression:', error.message);
        res.status(500).json({ message: error.message });
    }
}; 