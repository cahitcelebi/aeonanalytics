import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Game from '../models/Game.js';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database.js';
import { QueryTypes, Op } from 'sequelize';
import Session from '../models/Session.js';

const router = express.Router();

// Tüm oyun endpointleri için auth zorunlu
router.use(authenticateToken);

// Oyunları listele (sadece kendi oyunları)
router.get('/', async (req, res) => {
  try {
    const developerId = req.user.developerId;
    const games = await Game.findAll({ where: { developerId } });
    res.json({ success: true, games });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch games.' });
  }
});

// Oyun ekle
router.post('/', async (req, res) => {
  try {
    const developerId = req.user.developerId;
    const { name: postName, description: postDescription, platform: postPlatform, gameVersion: postGameVersion } = req.body;
    if (!postName) {
      return res.status(400).json({ success: false, message: 'Game name is required.' });
    }
    // Benzersiz API Key üret
    const apiKey = 'sk-' + uuidv4();
    const game = await Game.create({ name: postName, description: postDescription, platform: postPlatform, gameVersion: postGameVersion, apiKey, developerId });
    res.status(201).json({ success: true, game });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create game.' });
  }
});

// Oyun güncelle
router.put('/:id', async (req, res) => {
  try {
    const developerId = req.user.developerId;
    const { id } = req.params;
    const { name: putName, description: putDescription, platform: putPlatform, gameVersion: putGameVersion } = req.body;
    const game = await Game.findOne({ where: { id, developerId } });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }
    game.name = putName || game.name;
    game.description = putDescription || game.description;
    game.platform = putPlatform || game.platform;
    game.gameVersion = putGameVersion || game.gameVersion;
    await game.save();
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update game.' });
  }
});

// Oyun sil
router.delete('/:id', async (req, res) => {
  try {
    const developerId = req.user.developerId;
    const { id } = req.params;
    const game = await Game.findOne({ where: { id, developerId } });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }
    await game.destroy();
    res.json({ success: true, message: 'Game deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete game.' });
  }
});

// Oyun metrikleri (test ve prod mode)
router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    // Prod mode için gelişmiş metrikler ve zaman serisi
    // Günlük DAU
    const dailyDauQuery = `
      SELECT date_trunc('day', timestamp) as day, COUNT(DISTINCT playerId) as dau
      FROM events
      WHERE gameId = :id AND timestamp >= :start AND timestamp <= :end
      GROUP BY day
      ORDER BY day ASC
    `;
    // Günlük event sayısı
    const dailyEventQuery = `
      SELECT date_trunc('day', timestamp) as day, COUNT(*) as events
      FROM events
      WHERE gameId = :id AND timestamp >= :start AND timestamp <= :end
      GROUP BY day
      ORDER BY day ASC
    `;
    // Günlük yeni kullanıcı
    const dailyNewUserQuery = `
      SELECT day, COUNT(*) as newUsers
      FROM (
        SELECT playerId, date_trunc('day', MIN(timestamp)) as day
        FROM events
        WHERE gameId = :id AND timestamp >= :start AND timestamp <= :end
        GROUP BY playerId
      ) t
      GROUP BY day
      ORDER BY day ASC
    `;
    // Günlük oturum (session) sayısı
    const dailySessionQuery = `
      SELECT date_trunc('day', timestamp) as day, COUNT(DISTINCT sessionId) as sessions
      FROM events
      WHERE gameId = :id AND timestamp >= :start AND timestamp <= :end
      GROUP BY day
      ORDER BY day ASC
    `;
    // Ana metrikler (dau, wau, mau)
    const dauQuery = `
      SELECT COUNT(DISTINCT playerId) as dau
      FROM events
      WHERE gameId = :id
      AND timestamp >= :start
      AND timestamp <= :end
    `;
    const wauQuery = `
      SELECT COUNT(DISTINCT playerId) as wau
      FROM events
      WHERE gameId = :id
      AND timestamp >= :start::date - INTERVAL '7 days'
      AND timestamp <= :end
    `;
    const mauQuery = `
      SELECT COUNT(DISTINCT playerId) as mau
      FROM events
      WHERE gameId = :id
      AND timestamp >= :start::date - INTERVAL '30 days'
      AND timestamp <= :end
    `;
    const [dauResult, wauResult, mauResult, dailyDau, dailyEvents, dailyNewUsers, dailySessions] = await Promise.all([
      sequelize.query(dauQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT }),
      sequelize.query(wauQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT }),
      sequelize.query(mauQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT }),
      sequelize.query(dailyDauQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT }),
      sequelize.query(dailyEventQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT }),
      sequelize.query(dailyNewUserQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT }),
      sequelize.query(dailySessionQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT })
    ]);
    // Activity chart: daily DAU
    const activityChart = (dailyDau as any[]).map(row => ({
      date: row.day.toISOString().split('T')[0],
      users: parseInt(row.dau)
    }));
    // Event chart: daily events
    const eventChart = (dailyEvents as any[]).map(row => ({
      date: row.day.toISOString().split('T')[0],
      events: parseInt(row.events)
    }));
    // New user chart
    const newUserChart = (dailyNewUsers as any[]).map(row => ({
      date: row.day.toISOString().split('T')[0],
      newUsers: parseInt(row.newUsers)
    }));
    // Session chart
    const sessionChart = (dailySessions as any[]).map(row => ({
      date: row.day.toISOString().split('T')[0],
      sessions: parseInt(row.sessions)
    }));

    // Avg. Session Duration (gerçek hesaplama)
    const avgSession = await Session.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('durationSeconds')), 'avgDuration']],
      where: {
        gameId: id,
        startTime: { [Op.gte]: start },
        endTime: { [Op.lte]: end }
      },
      raw: true
    });
    const avgSessionDuration = avgSession && (avgSession as any)['avgDuration'] ? Math.round(Number((avgSession as any)['avgDuration'])) : 0;

    // Retention (cohort day1, day7, day30)
    // Day 0 cohort: her gün için yeni kullanıcılar
    const cohortQuery = `
      SELECT playerId, MIN(DATE(startTime)) as cohortDate
      FROM sessions
      WHERE gameId = :id AND startTime >= :start AND startTime <= :end
      GROUP BY playerId
    `;
    const cohorts = await sequelize.query(cohortQuery, { replacements: { id, start, end }, type: QueryTypes.SELECT });
    // Day 1, 7, 30 retention hesapla
    const retentionCounts = { day1: 0, day7: 0, day30: 0 };
    let totalCohort = 0;
    for (const cohort of cohorts as any[]) {
      totalCohort++;
      const playerId = cohort.playerId;
      const cohortDate = cohort.cohortDate;
      // Day 1
      const day1 = await Session.count({
        where: {
          playerId,
          gameId: id,
          startTime: {
            [Op.gte]: new Date(new Date(cohortDate).getTime() + 1 * 24 * 60 * 60 * 1000),
            [Op.lt]: new Date(new Date(cohortDate).getTime() + 2 * 24 * 60 * 60 * 1000)
          }
        }
      });
      if (day1 > 0) retentionCounts.day1++;
      // Day 7
      const day7 = await Session.count({
        where: {
          playerId,
          gameId: id,
          startTime: {
            [Op.gte]: new Date(new Date(cohortDate).getTime() + 7 * 24 * 60 * 60 * 1000),
            [Op.lt]: new Date(new Date(cohortDate).getTime() + 8 * 24 * 60 * 60 * 1000)
          }
        }
      });
      if (day7 > 0) retentionCounts.day7++;
      // Day 30
      const day30 = await Session.count({
        where: {
          playerId,
          gameId: id,
          startTime: {
            [Op.gte]: new Date(new Date(cohortDate).getTime() + 30 * 24 * 60 * 60 * 1000),
            [Op.lt]: new Date(new Date(cohortDate).getTime() + 31 * 24 * 60 * 60 * 1000)
          }
        }
      });
      if (day30 > 0) retentionCounts.day30++;
    }
    const retention = {
      day1: totalCohort > 0 ? Math.round((retentionCounts.day1 / totalCohort) * 100) : 0,
      day7: totalCohort > 0 ? Math.round((retentionCounts.day7 / totalCohort) * 100) : 0,
      day30: totalCohort > 0 ? Math.round((retentionCounts.day30 / totalCohort) * 100) : 0
    };

    res.json({
      dau: parseInt((dauResult[0] as any).dau) || 0,
      wau: parseInt((wauResult[0] as any).wau) || 0,
      mau: parseInt((mauResult[0] as any).mau) || 0,
      avgSessionDuration,
      retention,
      activityChart,
      retentionChart: [], // Geliştirilebilir
      eventChart,
      newUserChart,
      sessionChart
    });
  } catch (error) {
    console.error('METRICS ENDPOINT ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch metrics.' });
  }
});

// Oyun detayını getir (GET /api/games/:id)
router.get('/:id', async (req, res) => {
  try {
    const developerId = req.user.developerId;
    const { id } = req.params;
    const game = await Game.findOne({ where: { id, developerId } });
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found.' });
    }
    res.json({ success: true, game });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch game.' });
  }
});

export default router; 