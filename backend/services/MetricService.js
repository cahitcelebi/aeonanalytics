const { Op } = require('sequelize');
const Event = require('../models/Event');
const Metric = require('../models/Metric');
const sequelize = require('../config/database');

class MetricService {
    static async calculateDailyMetrics(gameId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // DAU hesaplama
        const dau = await Event.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'count']
            ],
            where: {
                game_id: gameId,
                timestamp: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        // Ortalama oturum süresi hesaplama
        const sessions = await Event.findAll({
            where: {
                game_id: gameId,
                event_name: ['session_start', 'session_end'],
                timestamp: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            order: [['user_id'], ['timestamp']]
        });

        // Gelir hesaplama
        const revenue = await Event.findAll({
            where: {
                game_id: gameId,
                event_name: 'purchase',
                timestamp: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        // Metrikleri kaydet
        await Promise.all([
            Metric.create({
                metric_name: 'dau',
                game_id: gameId,
                value: dau[0].get('count'),
                date: date
            }),
            Metric.create({
                metric_name: 'revenue',
                game_id: gameId,
                value: revenue.reduce((sum, event) => sum + (event.parameters.price || 0), 0),
                date: date
            })
        ]);
    }
}

module.exports = MetricService; 