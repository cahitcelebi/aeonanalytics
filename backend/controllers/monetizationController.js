const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const Monetization = require('../models/Monetization');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Record a purchase transaction
 */
exports.createTransaction = async (req, res) => {
    try {
        const {
            transaction_id,
            user_id,
            product_id,
            product_type,
            amount,
            currency,
            platform,
            timestamp,
            game_id
        } = req.body;

        // Validate required fields
        if (!transaction_id || !user_id || !product_id || amount === undefined) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'transaction_id, user_id, product_id, and amount are required'
            });
        }

        // Check amount is valid
        if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
            return res.status(400).json({
                error: 'Invalid amount',
                details: 'Amount must be a positive number'
            });
        }

        // Convert timestamp to Date object if provided
        let transactionDate;
        if (timestamp) {
            try {
                transactionDate = new Date(timestamp);
                if (isNaN(transactionDate.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                console.error('Invalid timestamp:', timestamp);
                transactionDate = new Date();
            }
        } else {
            transactionDate = new Date();
        }

        try {
            // Check if transaction already exists to avoid duplicates
            const existingTransaction = await Monetization.findOne({
                where: { transaction_id }
            });

            if (existingTransaction) {
                return res.status(409).json({
                    error: 'Transaction already exists',
                    transaction: existingTransaction
                });
            }

            // Create new transaction
            const transaction = await Monetization.create({
                transaction_id,
                user_id,
                product_id,
                product_type: product_type || null,
                amount: parseFloat(amount),
                currency: currency || 'USD',
                platform: platform || null,
                timestamp: transactionDate,
                game_id
            });

            res.status(201).json(transaction);
        } catch (dbError) {
            if (dbError.name === 'SequelizeUniqueConstraintError') {
                // Handle race condition with another check
                const existingTransaction = await Monetization.findOne({
                    where: { transaction_id }
                });
                
                return res.status(409).json({
                    error: 'Transaction already exists',
                    transaction: existingTransaction
                });
            }
            throw dbError;
        }
    } catch (error) {
        console.error('Error in createTransaction:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get transactions for a specific game
 */
exports.getTransactionsByGame = async (req, res) => {
    try {
        const { limit = 100, offset = 0, startDate, endDate, userId, productId } = req.query;
        
        let whereClause = { 
            game_id: req.params.gameId
        };
        
        // Add date filters if provided
        if (startDate || endDate) {
            whereClause.timestamp = {};
            
            if (startDate) {
                whereClause.timestamp[Op.gte] = new Date(startDate);
            }
            
            if (endDate) {
                whereClause.timestamp[Op.lte] = new Date(endDate);
            }
        }
        
        // Add user filter if provided
        if (userId) {
            whereClause.user_id = userId;
        }
        
        // Add product filter if provided
        if (productId) {
            whereClause.product_id = productId;
        }
        
        const transactions = await Monetization.findAll({ 
            where: whereClause,
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        // Get total count for pagination
        const count = await Monetization.count({ where: whereClause });
        
        // Calculate total revenue
        const totalResult = await Monetization.findAll({
            attributes: [
                'currency',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: whereClause,
            group: ['currency']
        });
        
        const totals = totalResult.map(item => ({
            currency: item.currency,
            total: parseFloat(item.get('total'))
        }));
        
        res.json({
            transactions,
            pagination: {
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            },
            totals
        });
    } catch (error) {
        console.error('Error in getTransactionsByGame:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get revenue summary by product
 */
exports.getRevenueSummaryByProduct = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let whereClause = { 
            game_id: req.params.gameId
        };
        
        // Add date filters if provided
        if (startDate || endDate) {
            whereClause.timestamp = {};
            
            if (startDate) {
                whereClause.timestamp[Op.gte] = new Date(startDate);
            }
            
            if (endDate) {
                whereClause.timestamp[Op.lte] = new Date(endDate);
            }
        }
        
        const summaryResult = await Monetization.findAll({
            attributes: [
                'product_id',
                'product_type',
                'currency',
                [sequelize.fn('COUNT', sequelize.col('*')), 'transaction_count'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
                [sequelize.fn('AVG', sequelize.col('amount')), 'average_revenue']
            ],
            where: whereClause,
            group: ['product_id', 'product_type', 'currency'],
            order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
        });
        
        // Format results
        const productSummary = summaryResult.map(item => ({
            product_id: item.product_id,
            product_type: item.product_type,
            currency: item.currency,
            transaction_count: parseInt(item.get('transaction_count')),
            total_revenue: parseFloat(item.get('total_revenue')),
            average_revenue: parseFloat(item.get('average_revenue'))
        }));
        
        res.json(productSummary);
    } catch (error) {
        console.error('Error in getRevenueSummaryByProduct:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get daily revenue data
 */
exports.getDailyRevenue = async (req, res) => {
    try {
        const { days = 30, currency = 'USD' } = req.query;
        const gameId = req.params.gameId;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        
        // Raw SQL for getting daily aggregates
        const result = await pool.query(`
            SELECT 
                DATE(timestamp) as date,
                SUM(amount) as total_amount,
                COUNT(*) as transaction_count
            FROM monetization
            WHERE game_id = $1 
            AND timestamp >= $2
            AND currency = $3
            GROUP BY DATE(timestamp)
            ORDER BY date
        `, [gameId, daysAgo, currency]);
        
        // Fill in missing dates with zero values
        const dailyData = [];
        const dateMap = new Map();
        
        // Create a map of existing data by date
        result.rows.forEach(row => {
            dateMap.set(row.date, {
                date: row.date,
                total_amount: parseFloat(row.total_amount),
                transaction_count: parseInt(row.transaction_count)
            });
        });
        
        // Fill in all dates in the range
        const currentDate = new Date(daysAgo);
        const today = new Date();
        
        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            
            if (dateMap.has(dateStr)) {
                dailyData.push(dateMap.get(dateStr));
            } else {
                dailyData.push({
                    date: dateStr,
                    total_amount: 0,
                    transaction_count: 0
                });
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        res.json({
            dailyRevenue: dailyData,
            period: {
                days: parseInt(days),
                from: daysAgo.toISOString(),
                currency
            }
        });
    } catch (error) {
        console.error('Error in getDailyRevenue:', error.message);
        res.status(500).json({ message: error.message });
    }
}; 

// GET /api/metrics/monetization/:gameId/paying-user-trend
exports.getPayingUserTrend = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const gameId = req.params.gameId;
    const result = await pool.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as paying_users
      FROM monetization
      WHERE game_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
      GROUP BY DATE(timestamp)
      ORDER BY date
    `, [gameId, startDate, endDate]);
    res.json({ payingUserTrend: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 