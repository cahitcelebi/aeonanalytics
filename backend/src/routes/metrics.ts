import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('metrics router loaded');
console.log('METRICS.TS LOADED');
router.get('/test', (req: Request, res: Response) => res.json({ ok: true }));

const toNull = (v: any) => (v === '' || v === undefined || v === null) ? null : v;

// Helper function to ensure text type
const toText = (v: any) => {
  if (v === null || v === undefined || v === '') return null;
  return String(v);
};

// Retention cache (in-memory, gün sonuna kadar)
// const retentionCache = new Map(); // KALDIRILDI

// Dashboard stats endpoint
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const activeSessionsResult = await pool.query("SELECT COUNT(*) FROM sessions WHERE end_time IS NULL");
    const totalEventsResult = await pool.query('SELECT COUNT(*) FROM events');
    res.json({
      totalUsers: parseInt(totalUsersResult.rows[0].count, 10),
      activeSessions: parseInt(activeSessionsResult.rows[0].count, 10),
      totalEvents: parseInt(totalEventsResult.rows[0].count, 10)
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Dashboard stats error: ' + error.message });
  }
});

// Overview endpoint: Sadece gerçek veriden prod mode
router.get('/overview/:gameId', async (req: Request, res: Response) => {
  console.log('[REVENUE QUERY PARAMS]', {
    gameId: req.params.gameId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    country: req.query.country,
    platform: req.query.platform,
    version: req.query.version,
    device: req.query.device,
    playerId: req.query.playerId
  });
  try {
    const { gameId } = req.params;
    const { startDate, endDate, platform = '', mode = 'prod' } = req.query;
    console.error('================= [OVERVIEW ENDPOINT ENTERED] =================');
    console.error('gameId:', gameId, 'startDate:', startDate, 'endDate:', endDate, 'platform:', platform, 'mode:', mode);
    const debugMsg = `[OVERVIEW DEBUG] gameId=${gameId} startDate=${startDate} endDate=${endDate} platform=${platform} mode=${mode} time=${new Date().toISOString()}`;
    console.error(debugMsg);
    console.error('[OVERVIEW DEBUG] startDate (raw):', startDate, typeof startDate);
    console.error('[OVERVIEW DEBUG] endDate (raw):', endDate, typeof endDate);
    console.log('req.query.country:', req.query.country, typeof req.query.country);
    console.log('req.query.version:', req.query.version, typeof req.query.version);
    console.log('req.query.device:', req.query.device, typeof req.query.device);
    if (!startDate || !endDate || (typeof startDate === 'string' && startDate.trim() === '') || (typeof endDate === 'string' && endDate.trim() === '')) {
      return res.status(400).json({ message: 'startDate ve endDate zorunlu ve boş olamaz.' });
    }
    // Filtre parametrelerini normalize et
    const country = toNull(req.query.country === 'all' ? null : req.query.country);
    const version = toNull(req.query.version === 'all' ? null : req.query.version);
    const device = toNull(req.query.device === 'all' ? null : req.query.device);
    const platformParam = toNull((platform === 'all' || platform === '') ? null : platform);
    const playerId = toNull(req.query.playerId === 'all' ? null : req.query.playerId);
    console.log('Incoming query:', { startDate, endDate, country, platform: platformParam, version, device });

    // startDate ve endDate parametreleri yoksa son 7 gün olarak ayarla
    const today = new Date();
    const defaultEnd = today.toISOString().slice(0, 10);
    const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let safeStartDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
    let safeEndDate = (endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd;
    // safeEndDate'i bir gün ileriye çek
    const safeEndDateObj = new Date(safeEndDate);
    safeEndDateObj.setDate(safeEndDateObj.getDate() + 1);
    const safeEndDatePlusOne = safeEndDateObj.toISOString().slice(0, 10);
    safeEndDate = safeEndDatePlusOne;
    // startDate ve endDate parametrelerinin tipini ve değerini logla
    console.log('safeStartDate (before):', safeStartDate, typeof safeStartDate);
    console.log('safeEndDate (before):', safeEndDate, typeof safeEndDate);
    if (!safeStartDate || typeof safeStartDate !== 'string' || safeStartDate.trim() === '') {
      safeStartDate = defaultStart;
      console.log('safeStartDate was invalid, set to default:', safeStartDate);
    }
    if (!safeEndDate || typeof safeEndDate !== 'string' || safeEndDate.trim() === '') {
      safeEndDate = defaultEnd;
      console.log('safeEndDate was invalid, set to default:', safeEndDate);
    }
    console.log('safeStartDate (final):', safeStartDate, typeof safeStartDate);
    console.log('safeEndDate (final):', safeEndDate, typeof safeEndDate);
    if (!safeStartDate || typeof safeStartDate !== 'string' || safeStartDate.trim() === '' ||
        !safeEndDate || typeof safeEndDate !== 'string' || safeEndDate.trim() === '') {
      return res.status(400).json({ message: 'startDate ve endDate zorunlu, string ve boş olamaz.' });
    }
    // Filtre parametrelerini hazırla
    const filterParams = [
      String(gameId),
      String(safeStartDate),
      String(safeEndDate),
      country,
      platformParam,
      version,
      device,
      playerId
    ];
    // Bugünün tarihi (UTC)
    const todayDate = new Date();
    const todayStr = todayDate.toISOString().slice(0, 10);
    console.log('[DATE RANGES]', {
      todayDate,
      todayStr,
      safeStartDate,
      safeEndDate,
      prevStartDate: new Date(new Date(safeStartDate).getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      prevEndDate: safeStartDate
    });
    const dauStart = todayStr;
    const dauEnd = new Date(todayDate.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const wauStart = new Date(todayDate.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const mauStart = new Date(todayDate.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    // Önceki dönem hesaplaması için ortak değişkenler
    const periodDays = Math.ceil((new Date(safeEndDate).getTime() - new Date(safeStartDate).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(safeStartDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const prevEndDate = safeStartDate;
    // --- DAU METRİĞİ ---
    let dauResult, wauResult, mauResult, prevDauResult, prevWauResult, prevMauResult;
    let avgSessionDurationResult, prevAvgSessionDurationResult;
    let dailySessionsResult, prevDailySessionsResult;
    let churnRateResult;
    try {
      // DAU (bugün)
      dauResult = await pool.query(
        `SELECT COUNT(DISTINCT s."playerId") as dau
         FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
        `,
        [
          String(gameId),
          dauStart,
          dauEnd,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      // DAU (dünkü değer)
      const prevDauStart = new Date(todayDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const prevDauEnd = todayStr;
      prevDauResult = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as dau
       FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
        `,
        [
          String(gameId),
          prevDauStart,
          prevDauEnd,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      // WAU (son 7 gün)
      wauResult = await pool.query(
        `SELECT COUNT(DISTINCT s."playerId") as wau
         FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
        [
          String(gameId),
          wauStart,
          dauEnd,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
    );
      // WAU (önceki 7 gün)
      const prevWauStart = new Date(todayDate.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const prevWauEnd = wauStart;
      prevWauResult = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as wau
       FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
        [
          String(gameId),
          prevWauStart,
          prevWauEnd,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      // MAU (son 30 gün)
      mauResult = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as mau
       FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
        [
          String(gameId),
          mauStart,
          dauEnd,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
    );
      // MAU (önceki 30 gün)
      const prevMauStart = new Date(todayDate.getTime() - 59 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const prevMauEnd = mauStart;
      prevMauResult = await pool.query(
        `SELECT COUNT(DISTINCT s."playerId") as mau
       FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
        [
          String(gameId),
          prevMauStart,
          prevMauEnd,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // Average Session Duration (seçilen tarih aralığı)
      avgSessionDurationResult = await pool.query(
        `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as avg_duration
         FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND s."endTime" IS NOT NULL
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)`,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // Average Session Duration (önceki dönem)
      prevAvgSessionDurationResult = await pool.query(
        `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as avg_duration
        FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
        WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND s."endTime" IS NOT NULL
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)`,
        [
          String(gameId),
          prevStartDate,
          prevEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // Daily Sessions (seçilen tarih aralığı)
      dailySessionsResult = await pool.query(
        `SELECT COUNT(*) as session_count
       FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)`,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // Daily Sessions (önceki dönem)
      prevDailySessionsResult = await pool.query(
        `SELECT COUNT(*) as session_count
        FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
        WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)`,
        [
          String(gameId),
          prevStartDate,
          prevEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // Average Sessions per User (seçili dönem)
      let avgSessionPerUser = 0;
      if (dailySessionsResult.rows[0]?.session_count && wauResult.rows[0]?.wau) {
        const userCount = await pool.query(
          `SELECT COUNT(DISTINCT s."playerId") as user_count
           FROM sessions s
           JOIN devices d ON d."playerId" = s."playerId"
           JOIN games g ON g.id = s."gameId"
           WHERE s."gameId" = $1
             AND s."startTime" >= $2::date
             AND s."startTime" < $3::date
             AND ($4::text IS NULL OR d."country" = $4::text)
             AND ($5::text IS NULL OR d."platform" = $5::text)
             AND ($6::text IS NULL OR g."gameVersion" = $6::text)
             AND ($7::text IS NULL OR d."deviceModel" = $7::text)
             AND ($8::text IS NULL OR s."playerId" = $8::int)`,
          [
            String(gameId),
            safeStartDate,
            safeEndDate,
            country,
            platformParam,
            version,
            device,
            playerId
          ]
        );
        const userCountVal = parseInt(userCount.rows[0]?.user_count || 0);
        avgSessionPerUser = userCountVal > 0 ? dailySessionsResult.rows[0].session_count / userCountVal : 0;
      }
      // Average Sessions per User (önceki dönem)
      let avgSessionPerUserPrev = 0;
      const userCountPrev = await pool.query(
        `SELECT COUNT(DISTINCT s."playerId") as user_count
         FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date
           AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)`,
        [
          String(gameId),
          prevStartDate,
          prevEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      const userCountPrevVal = parseInt(userCountPrev.rows[0]?.user_count || 0);
      avgSessionPerUserPrev = userCountPrevVal > 0 ? prevDailySessionsResult.rows[0].session_count / userCountPrevVal : 0;

      // New Users (Period)
      const newUsersResult = await pool.query(
        `SELECT COUNT(*) as new_users
         FROM (
           SELECT s."playerId", MIN(s."startTime") as first_session
           FROM sessions s
           JOIN devices d ON d."playerId" = s."playerId"
           JOIN games g ON g.id = s."gameId"
           WHERE s."gameId" = $1
             AND ($2::text IS NULL OR d."country" = $2::text)
             AND ($3::text IS NULL OR d."platform" = $3::text)
             AND ($4::text IS NULL OR g."gameVersion" = $4::text)
             AND ($5::text IS NULL OR d."deviceModel" = $5::text)
             AND ($6::text IS NULL OR s."playerId" = $6::int)
           GROUP BY s."playerId"
         ) t
         WHERE t.first_session >= $7::date AND t.first_session < $8::date
        `,
        [
          String(gameId),
          country,
          platformParam,
          version,
          device,
          playerId,
          safeStartDate,
          safeEndDate
        ]
      );
      // New Users (Prev Period)
      const newUsersPrevResult = await pool.query(
        `SELECT COUNT(*) as new_users
         FROM (
           SELECT s."playerId", MIN(s."startTime") as first_session
           FROM sessions s
           JOIN devices d ON d."playerId" = s."playerId"
           JOIN games g ON g.id = s."gameId"
           WHERE s."gameId" = $1
             AND ($2::text IS NULL OR d."country" = $2::text)
             AND ($3::text IS NULL OR d."platform" = $3::text)
             AND ($4::text IS NULL OR g."gameVersion" = $4::text)
             AND ($5::text IS NULL OR d."deviceModel" = $5::text)
             AND ($6::text IS NULL OR s."playerId" = $6::int)
           GROUP BY s."playerId"
         ) t
         WHERE t.first_session >= $7::date AND t.first_session < $8::date
        `,
        [
          String(gameId),
          country,
          platformParam,
          version,
          device,
          playerId,
          prevStartDate,
          prevEndDate
        ]
      );

      // Retention (1/7/30) - sticky bar tarih filtresine göre cohort
      // const retentionKey = JSON.stringify({ ... }); // KALDIRILDI
      // const todayStrForCache = new Date().toISOString().slice(0, 10); // KALDIRILDI
      let retention;
      // const cached = retentionCache.get(retentionKey);
      // if (cached && cached.date === todayStrForCache) {
      //   retention = cached.value;
      // } else {
        // Seçili aralıkta ilk defa oturum açan kullanıcılar (cohort)
        const cohortResult = await pool.query(
          `SELECT s."playerId", MIN(s."startTime") as first_session
           FROM sessions s
           JOIN devices d ON d."playerId" = s."playerId"
           JOIN games g ON g.id = s."gameId"
           WHERE s."gameId" = $1
             AND ($2::text IS NULL OR d."country" = $2::text)
             AND ($3::text IS NULL OR d."platform" = $3::text)
             AND ($4::text IS NULL OR g."gameVersion" = $4::text)
             AND ($5::text IS NULL OR d."deviceModel" = $5::text)
             AND ($6::text IS NULL OR s."playerId" = $6::int)
        GROUP BY s."playerId"
           HAVING MIN(s."startTime") >= $7::date AND MIN(s."startTime") < $8::date
          `,
          [
            String(gameId),
            country,
            platformParam,
            version,
            device,
            playerId,
            safeStartDate,
            safeEndDate
          ]
        );
        const cohort = cohortResult.rows;
        let day1 = 0, day7 = 0, day30 = 0;
        for (const user of cohort) {
          const playerId = user.playerId;
          const firstSession = new Date(user.first_session);
          // Takvim günü bazlı window hesaplama
          // Cohort günü (sadece tarih)
          const cohortDate = new Date(Date.UTC(firstSession.getUTCFullYear(), firstSession.getUTCMonth(), firstSession.getUTCDate(), 0, 0, 0));
          // D1: cohortDate +1 günün 00:00:00 ile 23:59:59 arası
          const day1Date = new Date(cohortDate);
          day1Date.setUTCDate(day1Date.getUTCDate() + 1);
          const day1Start = new Date(Date.UTC(day1Date.getUTCFullYear(), day1Date.getUTCMonth(), day1Date.getUTCDate(), 0, 0, 0));
          const day1End = new Date(Date.UTC(day1Date.getUTCFullYear(), day1Date.getUTCMonth(), day1Date.getUTCDate(), 23, 59, 59, 999));
          const day1Result = await pool.query(
            `SELECT 1 FROM sessions s WHERE s."playerId" = $1 AND s."gameId" = $2 AND s."startTime" >= $3 AND s."startTime" <= $4 LIMIT 1`,
            [playerId, gameId, day1Start.toISOString(), day1End.toISOString()]
          );
          if ((day1Result?.rowCount || 0) > 0) day1++;
          // D7: cohortDate +7 günün 00:00:00 ile 23:59:59 arası
          const day7Date = new Date(cohortDate);
          day7Date.setUTCDate(day7Date.getUTCDate() + 7);
          const day7Start = new Date(Date.UTC(day7Date.getUTCFullYear(), day7Date.getUTCMonth(), day7Date.getUTCDate(), 0, 0, 0));
          const day7End = new Date(Date.UTC(day7Date.getUTCFullYear(), day7Date.getUTCMonth(), day7Date.getUTCDate(), 23, 59, 59, 999));
          const day7Result = await pool.query(
            `SELECT 1 FROM sessions s WHERE s."playerId" = $1 AND s."gameId" = $2 AND s."startTime" >= $3 AND s."startTime" <= $4 LIMIT 1`,
            [playerId, gameId, day7Start.toISOString(), day7End.toISOString()]
          );
          if ((day7Result?.rowCount || 0) > 0) day7++;
          // D30: cohortDate +30 günün 00:00:00 ile 23:59:59 arası
          const day30Date = new Date(cohortDate);
          day30Date.setUTCDate(day30Date.getUTCDate() + 30);
          const day30Start = new Date(Date.UTC(day30Date.getUTCFullYear(), day30Date.getUTCMonth(), day30Date.getUTCDate(), 0, 0, 0));
          const day30End = new Date(Date.UTC(day30Date.getUTCFullYear(), day30Date.getUTCMonth(), day30Date.getUTCDate(), 23, 59, 59, 999));
          const day30Result = await pool.query(
            `SELECT 1 FROM sessions s WHERE s."playerId" = $1 AND s."gameId" = $2 AND s."startTime" >= $3 AND s."startTime" <= $4 LIMIT 1`,
            [playerId, gameId, day30Start.toISOString(), day30End.toISOString()]
          );
          if ((day30Result?.rowCount || 0) > 0) day30++;
        }
        const total = cohort.length;
        retention = {
          day1: total > 0 ? Math.round((day1 / total) * 100) : 0,
          day7: total > 0 ? Math.round((day7 / total) * 100) : 0,
          day30: total > 0 ? Math.round((day30 / total) * 100) : 0
        };
      // retentionCache.set(retentionKey, { value: retention, date: todayStrForCache }); // KALDIRILDI
      // }

      // Churn Rate hesaplama
      churnRateResult = await pool.query(
        `WITH user_activity AS (
          SELECT 
            s."playerId",
            DATE_TRUNC('day', s."startTime") as activity_date
          FROM sessions s
          JOIN devices d ON d."playerId" = s."playerId"
          JOIN games g ON g.id = s."gameId"
          WHERE s."gameId" = $1
            AND s."startTime" >= $2::date
            AND s."startTime" < $3::date
            AND ($4::text IS NULL OR d."country" = $4::text)
            AND ($5::text IS NULL OR d."platform" = $5::text)
            AND ($6::text IS NULL OR g."gameVersion" = $6::text)
            AND ($7::text IS NULL OR d."deviceModel" = $7::text)
            AND ($8::text IS NULL OR s."playerId" = $8::int)
          GROUP BY s."playerId", DATE_TRUNC('day', s."startTime")
        ),
        churned_users AS (
          SELECT 
            activity_date,
            COUNT(DISTINCT "playerId") as churned_count
          FROM user_activity ua1
          WHERE NOT EXISTS (
            SELECT 1 
            FROM user_activity ua2 
            WHERE ua2."playerId" = ua1."playerId"
              AND ua2.activity_date > ua1.activity_date
              AND ua2.activity_date <= ua1.activity_date + INTERVAL '7 days'
          )
          GROUP BY activity_date
        ),
        total_users AS (
        SELECT 
            activity_date,
            COUNT(DISTINCT "playerId") as total_count
          FROM user_activity
          GROUP BY activity_date
      )
      SELECT 
          cu.activity_date::date as date,
          ROUND((cu.churned_count::float / NULLIF(tu.total_count, 0) * 100)::numeric, 2) as churn_rate
        FROM churned_users cu
        JOIN total_users tu ON tu.activity_date = cu.activity_date
        ORDER BY cu.activity_date
        `,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // === Total Revenue (current period, tüm filtrelerle) ===
      console.log('[REVENUE QUERY PARAMS]', {
        gameId,
        safeStartDate,
        safeEndDate,
        country,
        platformParam,
        version,
        device,
        playerId
      });

      // Test query to see all rows
      const testQuery = await pool.query(
        `SELECT m.*, d.country, d.platform, g."gameVersion", d."deviceModel"
         FROM monetization m
         JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
         JOIN games g ON g.id = m."gameId"
         WHERE m."gameId" = $1
           AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
        `,
        [String(gameId), safeStartDate, safeEndDate]
      );
      console.log('[TEST QUERY RESULT]', testQuery.rows);

      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(CAST(m.amount AS DECIMAL(10,2))), 0) as totalrevenue
         FROM monetization m
         JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
         JOIN games g ON g.id = m."gameId"
         WHERE m."gameId" = $1
           AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR m."playerId" = $8::int)
        `,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      console.log('[REVENUE QUERY RESULT]', revenueResult.rows[0]);
      console.log('[REVENUE QUERY RESULT DETAILS]', revenueResult.rows);
      const rawRevenue = revenueResult.rows[0]?.totalrevenue;
      console.log('[RAW REVENUE]', rawRevenue, typeof rawRevenue);
      const totalRevenue = typeof rawRevenue === 'string' ? parseFloat(rawRevenue) : Number(rawRevenue);
      console.log('[PARSED TOTAL REVENUE]', totalRevenue, typeof totalRevenue);

      // === Total Revenue (previous period, tüm filtrelerle) ===
      const revenuePrevResult = await pool.query(
        `SELECT COALESCE(SUM(m.amount), 0) as totalRevenue
         FROM monetization m
         JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
         JOIN games g ON g.id = m."gameId"
         WHERE m."gameId" = $1
           AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR m."playerId" = $8::int)
        `,
        [
          String(gameId),
          prevStartDate,
          prevEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      console.log('[PREV REVENUE QUERY RESULT]', revenuePrevResult.rows[0]);
      const totalRevenuePrev = parseFloat(revenuePrevResult.rows[0]?.totalRevenue || 0);
      console.log('[PARSED PREV TOTAL REVENUE]', totalRevenuePrev);

      // === ARPU & ARPU Prev ===
      console.log('[MAU RESULT]', mauResult.rows[0]);
      console.log('[PREV MAU RESULT]', prevMauResult.rows[0]);
      const arpu = (typeof totalRevenue === 'number' && mauResult.rows[0]?.mau > 0) ? totalRevenue / mauResult.rows[0].mau : 0;
      const arpuPrev = (typeof totalRevenuePrev === 'number' && prevMauResult.rows[0]?.mau > 0) ? totalRevenuePrev / prevMauResult.rows[0].mau : 0;
      console.log('[CALCULATED ARPU]', { arpu, arpuPrev });

      // === Paying Users Count (current period) ===
    const payingUsersResult = await pool.query(
        `SELECT COUNT(DISTINCT m."playerId") as paying_users
         FROM monetization m
         JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
         JOIN games g ON g.id = m."gameId"
         WHERE m."gameId" = $1
           AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR m."playerId" = $8::int)
        `,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // === Paying Users Count (previous period) ===
      const payingUsersPrevResult = await pool.query(
        `SELECT COUNT(DISTINCT m."playerId") as paying_users
         FROM monetization m
         JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
         JOIN games g ON g.id = m."gameId"
         WHERE m."gameId" = $1
           AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR m."playerId" = $8::int)
        `,
        [
          String(gameId),
          prevStartDate,
          prevEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      const payingUsers = parseInt(payingUsersResult.rows[0]?.paying_users || 0);
      const payingUsersPrev = parseInt(payingUsersPrevResult.rows[0]?.paying_users || 0);

      // === ARPPU & ARPPU Prev ===
      const arppu = (typeof totalRevenue === 'number' && payingUsers > 0) ? totalRevenue / payingUsers : 0;
      const arppuPrev = (typeof totalRevenuePrev === 'number' && payingUsersPrev > 0) ? totalRevenuePrev / payingUsersPrev : 0;

      // === Conversion Rate & Conversion Rate Prev ===
      const conversionRate = (mauResult.rows[0]?.mau > 0) ? (payingUsers / mauResult.rows[0].mau) * 100 : 0;
      const conversionRatePrev = (prevMauResult.rows[0]?.mau > 0) ? (payingUsersPrev / prevMauResult.rows[0].mau) * 100 : 0;

      // === Trend/Change Oranları ===
      const totalRevenueChange = (totalRevenuePrev === 0) ? null : ((totalRevenue - totalRevenuePrev) / Math.abs(totalRevenuePrev)) * 100;
      const arpuChange = (arpuPrev === 0) ? null : ((arpu - arpuPrev) / Math.abs(arpuPrev)) * 100;
      const arppuChange = (arppuPrev === 0) ? null : ((arppu - arppuPrev) / Math.abs(arppuPrev)) * 100;
      const conversionRateChange = (conversionRatePrev === 0) ? null : ((conversionRate - conversionRatePrev) / Math.abs(conversionRatePrev)) * 100;

      // === Revenue Trend (seçili tarih aralığı) ===
      const revenueTrendResult = await pool.query(
        `SELECT m.timestamp::date as date, SUM(CAST(m.amount AS DECIMAL(10,2))) as revenue
       FROM monetization m
         JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
         JOIN games g ON g.id = m."gameId"
         WHERE m."gameId" = $1
           AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR m."playerId" = $8::int)
         GROUP BY m.timestamp::date
         ORDER BY date ASC
        `,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );
      // === DAU Trend (seçili tarih aralığı) ===
      const dauTrendResult = await pool.query(
        `SELECT s."startTime"::date as date, COUNT(DISTINCT s."playerId") as dau
         FROM sessions s
         JOIN devices d ON d."playerId" = s."playerId"
         JOIN games g ON g.id = s."gameId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d."country" = $4::text)
           AND ($5::text IS NULL OR d."platform" = $5::text)
           AND ($6::text IS NULL OR g."gameVersion" = $6::text)
           AND ($7::text IS NULL OR d."deviceModel" = $7::text)
           AND ($8::text IS NULL OR s."playerId" = $8::int)
         GROUP BY s."startTime"::date
         ORDER BY date ASC
        `,
        [
          String(gameId),
          safeStartDate,
          safeEndDate,
          country,
          platformParam,
          version,
          device,
          playerId
        ]
      );

      // === SUMMARY ===
      const summary = {
        dau: parseInt(dauResult.rows[0]?.dau || 0),
        dauPrev: parseInt(prevDauResult?.rows?.[0]?.dau || 0),
        wau: parseInt(wauResult.rows[0]?.wau || 0),
        wauPrev: parseInt(prevWauResult?.rows?.[0]?.wau || 0),
        mau: parseInt(mauResult.rows[0]?.mau || 0),
        mauPrev: parseInt(prevMauResult?.rows?.[0]?.mau || 0),
        avgSessionDuration: Math.round(parseFloat(avgSessionDurationResult.rows[0]?.avg_duration || 0)),
        avgSessionDurationPrev: Math.round(parseFloat(prevAvgSessionDurationResult.rows[0]?.avg_duration || 0)),
        dailySessions: parseInt(dailySessionsResult.rows[0]?.session_count || 0),
        dailySessionsPrev: parseInt(prevDailySessionsResult.rows[0]?.session_count || 0),
        avgSessionPerUser: avgSessionPerUser,
        avgSessionPerUserPrev: avgSessionPerUserPrev,
        newUsers: parseInt(newUsersResult.rows[0]?.new_users || 0),
        newUsersPrev: parseInt(newUsersPrevResult.rows[0]?.new_users || 0),
        retention,
        totalRevenue,
        totalRevenuePrev,
        totalRevenueChange,
        arpu,
        arpuPrev,
        arpuChange,
        arppu,
        arppuPrev,
        arppuChange,
        conversionRate,
        conversionRatePrev,
        conversionRateChange,
        churnRate: churnRateResult.rows.map(row => ({
          date: row.date,
          rate: parseFloat(row.churn_rate)
        })),
        revenueTrend: revenueTrendResult.rows.map(row => ({
          date: row.date,
          revenue: parseFloat(row.revenue)
        })),
        dauTrend: dauTrendResult.rows.map(row => ({
          date: row.date,
          dau: parseInt(row.dau)
        }))
      };
      console.log('[SUMMARY OVERVIEW RESPONSE TEST123456789]', summary);
      res.json({ summary });
    } catch (error: any) {
      console.error('Overview error:', error);
      res.status(500).json({ error: 'Overview error: ' + error.message });
    }
  } catch (error: any) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Overview error: ' + error.message });
  }
});

// Engagement endpoint: returns all engagement metrics except DAU/WAU/MAU
router.get('/engagement/:gameId', async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { startDate, endDate, platform = '', country, version, device, playerId } = req.query;
    // Normalize filters
    const countryParam = !country || country === 'all' ? null : country;
    const versionParam = !version || version === 'all' ? null : version;
    const deviceParam = !device || device === 'all' ? null : device;
    const platformParam = !platform || platform === 'all' ? null : platform;
    const playerIdParam = !playerId || playerId === 'all' ? null : playerId;
    // Default date range: last 7 days
    const today = new Date();
    const defaultEnd = today.toISOString().slice(0, 10);
    const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let safeStartDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
    let safeEndDate = (endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd;
    // End date +1 day for SQL
    const safeEndDateObj = new Date(safeEndDate);
    safeEndDateObj.setDate(safeEndDateObj.getDate() + 1);
    safeEndDate = safeEndDateObj.toISOString().slice(0, 10);
    // Calculate previous period dates (same as Overview)
    const periodDays = Math.ceil((new Date(safeEndDate).getTime() - new Date(safeStartDate).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(safeStartDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const prevEndDate = safeStartDate;
    // Filters for SQL
    const filterParams = [
      String(gameId),
      String(safeStartDate),
      String(safeEndDate),
      countryParam,
      platformParam,
      versionParam,
      deviceParam,
      playerIdParam
    ];
    // --- Metrics ---
    // Avg. Session Duration
    const avgSessionDurationResult = await pool.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as avg_duration
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND s."endTime" IS NOT NULL
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
      filterParams
    );
    const avgSessionDuration = Math.round(parseFloat(avgSessionDurationResult.rows[0]?.avg_duration || 0));
    // Session Count (total)
    const sessionCountResult = await pool.query(
      `SELECT COUNT(*) as session_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
      filterParams
    );
    const sessionCount = parseInt(sessionCountResult.rows[0]?.session_count || 0);
    // Active Users (total)
    const activeUsersResult = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as active_users
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
      filterParams
    );
    const activeUsers = parseInt(activeUsersResult.rows[0]?.active_users || 0);
    // Session per User
    const sessionPerUser = activeUsers > 0 ? sessionCount / activeUsers : 0;
    // Returning Users
    const returningUsersResult = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as returning_users
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
         AND EXISTS (
           SELECT 1 FROM sessions s2
           WHERE s2."gameId" = s."gameId"
             AND s2."playerId" = s."playerId"
             AND s2."startTime" < $2::date
         )
      `,
      filterParams
    );
    const returningUsers = parseInt(returningUsersResult.rows[0]?.returning_users || 0);
    // Churn Rate (same as overview)
    const churnRateResult = await pool.query(
      `WITH user_activity AS (
        SELECT 
          s."playerId",
          DATE_TRUNC('day', s."startTime") as activity_date
        FROM sessions s
        JOIN devices d ON d."playerId" = s."playerId"
        JOIN games g ON g.id = s."gameId"
        WHERE s."gameId" = $1
          AND s."startTime" >= $2::date
          AND s."startTime" < $3::date
          AND ($4::text IS NULL OR d."country" = $4::text)
          AND ($5::text IS NULL OR d."platform" = $5::text)
          AND ($6::text IS NULL OR g."gameVersion" = $6::text)
          AND ($7::text IS NULL OR d."deviceModel" = $7::text)
          AND ($8::text IS NULL OR s."playerId" = $8::int)
        GROUP BY s."playerId", DATE_TRUNC('day', s."startTime")
      ),
      churned_users AS (
        SELECT 
          activity_date,
          COUNT(DISTINCT "playerId") as churned_count
        FROM user_activity ua1
        WHERE NOT EXISTS (
          SELECT 1 
          FROM user_activity ua2 
          WHERE ua2."playerId" = ua1."playerId"
            AND ua2.activity_date > ua1.activity_date
            AND ua2.activity_date <= ua1.activity_date + INTERVAL '7 days'
        )
        GROUP BY activity_date
      ),
      total_users AS (
        SELECT 
          activity_date,
          COUNT(DISTINCT "playerId") as total_count
        FROM user_activity
        GROUP BY activity_date
      )
      SELECT 
        cu.activity_date::date as date,
        ROUND((cu.churned_count::float / NULLIF(tu.total_count, 0) * 100)::numeric, 2) as churn_rate
      FROM churned_users cu
      JOIN total_users tu ON tu.activity_date = cu.activity_date
      ORDER BY cu.activity_date
      `,
      filterParams
    );
    const churnRate = churnRateResult.rows.map(row => ({ date: row.date, rate: parseFloat(row.churn_rate) }));
    // Session Count by Day
    const sessionCountByDayResult = await pool.query(
      `SELECT s."startTime"::date as date, COUNT(*) as session_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
       GROUP BY s."startTime"::date
       ORDER BY date ASC
      `,
      filterParams
    );
    const sessionCountByDay = sessionCountByDayResult.rows.map(row => ({ date: row.date, count: parseInt(row.session_count) }));
    // Active Users by Day
    const activeUsersByDayResult = await pool.query(
      `SELECT s."startTime"::date as date, COUNT(DISTINCT s."playerId") as active_users
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
       GROUP BY s."startTime"::date
       ORDER BY date ASC
      `,
      filterParams
    );
    const activeUsersByDay = activeUsersByDayResult.rows.map(row => ({ date: row.date, count: parseInt(row.active_users) }));
    // --- Retention (1/7/30) and Cohort Table ---
    // Get cohort: users whose first session is in the period
    const cohortResult = await pool.query(
      `SELECT s."playerId", MIN(s."startTime") as first_session
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
       GROUP BY s."playerId"
       HAVING MIN(s."startTime") >= $2::date AND MIN(s."startTime") < $3::date
      `,
      filterParams
    );
    const cohort = cohortResult.rows;
    // Retention curve (days 0-30)
    const retentionCurve = [];
    const cohortTable: any[] = [];
    const totalCohort = cohort.length;
    // Build cohort table: for each user, check if they returned on day 1, 2, ..., 30
    for (let day = 0; day <= 30; day++) {
      let retained = 0;
      for (const user of cohort) {
        const playerId = user.playerId;
        const firstSession = new Date(user.first_session);
        const dayStart = new Date(firstSession.getTime() + day * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(firstSession.getTime() + (day + 1) * 24 * 60 * 60 * 1000);
        const result = await pool.query(
          `SELECT 1 FROM sessions s WHERE s."playerId" = $1 AND s."gameId" = $2 AND s."startTime" >= $3 AND s."startTime" < $4 LIMIT 1`,
          [playerId, gameId, dayStart.toISOString(), dayEnd.toISOString()]
        );
        if ((result?.rowCount || 0) > 0) retained++;
      }
      retentionCurve.push({ day, rate: totalCohort > 0 ? Math.round((retained / totalCohort) * 100) : 0 });
    }
    // Build cohort table: group by cohort date
    const cohortByDate: Record<string, string[]> = {};
    for (const user of cohort) {
      const cohortDate = new Date(user.first_session).toISOString().slice(0, 10);
      if (!cohortByDate[cohortDate]) cohortByDate[cohortDate] = [];
      cohortByDate[cohortDate].push(user.playerId);
    }
    for (const [cohortDate, playerIds] of Object.entries(cohortByDate)) {
      const row: any = { cohortDate, size: playerIds.length };
      for (let day = 0; day <= 30; day++) {
        let retained = 0;
        for (const playerId of playerIds) {
          const firstSession = new Date(cohort.find(u => u.playerId === playerId).first_session);
          const dayStart = new Date(firstSession.getTime() + day * 24 * 60 * 60 * 1000);
          const dayEnd = new Date(firstSession.getTime() + (day + 1) * 24 * 60 * 60 * 1000);
          const result = await pool.query(
            `SELECT 1 FROM sessions s WHERE s."playerId" = $1 AND s."gameId" = $2 AND s."startTime" >= $3 AND s."startTime" < $4 LIMIT 1`,
            [playerId, gameId, dayStart.toISOString(), dayEnd.toISOString()]
          );
          if ((result?.rowCount || 0) > 0) retained++;
        }
        row[`day${day}`] = playerIds.length > 0 ? Math.round((retained / playerIds.length) * 100) : 0;
      }
      cohortTable.push(row);
    }
    // Day 1/7/30 retention
    const day1 = retentionCurve[1]?.rate || 0;
    const day7 = retentionCurve[7]?.rate || 0;
    const day30 = retentionCurve[30]?.rate || 0;

    // Avg. Session Duration (önceki dönem)
    const avgSessionDurationPrevResult = await pool.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as avg_duration
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date
         AND s."startTime" < $3::date
         AND s."endTime" IS NOT NULL
         AND ($4::text IS NULL OR d."country" = $4::text)
         AND ($5::text IS NULL OR d."platform" = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
      [
        String(req.params.gameId),
        prevStartDate,
        prevEndDate,
        req.query.country || null,
        req.query.platform || null,
        req.query.version || null,
        req.query.device || null,
        req.query.playerId || null
      ]
    );
    const avgSessionDurationPrev = Math.round(parseFloat(avgSessionDurationPrevResult.rows[0]?.avg_duration || 0));
    // Churn Rate (aggregate, seçili dönem)
    const churnRateValue = churnRate.length > 0 ? churnRate[churnRate.length - 1].rate : 0;
    // Churn Rate (önceki dönem)
    const churnRatePrevResult = await pool.query(
      `WITH user_activity AS (
        SELECT 
          s."playerId",
          DATE_TRUNC('day', s."startTime") as activity_date
        FROM sessions s
        JOIN devices d ON d."playerId" = s."playerId"
        JOIN games g ON g.id = s."gameId"
        WHERE s."gameId" = $1
          AND s."startTime" >= $2::date
          AND s."startTime" < $3::date
          AND ($4::text IS NULL OR d."country" = $4::text)
          AND ($5::text IS NULL OR d."platform" = $5::text)
          AND ($6::text IS NULL OR g."gameVersion" = $6::text)
          AND ($7::text IS NULL OR d."deviceModel" = $7::text)
          AND ($8::text IS NULL OR s."playerId" = $8::int)
        GROUP BY s."playerId", DATE_TRUNC('day', s."startTime")
      ),
      churned_users AS (
        SELECT 
          activity_date,
          COUNT(DISTINCT "playerId") as churned_count
        FROM user_activity ua1
        WHERE NOT EXISTS (
          SELECT 1 
          FROM user_activity ua2 
          WHERE ua2."playerId" = ua1."playerId"
            AND ua2.activity_date > ua1.activity_date
            AND ua2.activity_date <= ua1.activity_date + INTERVAL '7 days'
        )
        GROUP BY activity_date
      ),
      total_users AS (
        SELECT 
          activity_date,
          COUNT(DISTINCT "playerId") as total_count
        FROM user_activity
        GROUP BY activity_date
      )
      SELECT 
        cu.activity_date::date as date,
        ROUND((cu.churned_count::float / NULLIF(tu.total_count, 0) * 100)::numeric, 2) as churn_rate
      FROM churned_users cu
      JOIN total_users tu ON tu.activity_date = cu.activity_date
      ORDER BY cu.activity_date
      `,
      [
        String(req.params.gameId),
        prevStartDate,
        prevEndDate,
        req.query.country || null,
        req.query.platform || null,
        req.query.version || null,
        req.query.device || null,
        req.query.playerId || null
      ]
    );
    const churnRatePrevArr = churnRatePrevResult.rows.map(row => parseFloat(row.churn_rate));
    const churnRatePrev = churnRatePrevArr.length > 0 ? churnRatePrevArr[churnRatePrevArr.length - 1] : 0;
    // Response
    res.json({
      avgSessionDuration,
      avgSessionDurationPrev,
      sessionCount,
      activeUsers,
      sessionPerUser,
      returningUsers,
      churnRate: churnRateValue,
      churnRatePrev,
      sessionCountByDay,
      activeUsersByDay,
      retention: { day1, day7, day30 },
      retentionCurve,
      cohortTable
    });
  } catch (error: any) {
    console.error('Engagement endpoint error:', error);
    res.status(500).json({ error: 'Engagement endpoint error: ' + error.message });
  }
});

// Realtime metrics endpoint (real data, last 24 hours, hourly breakdown)
router.get('/realtime/:gameId', async (req, res) => {
  const { gameId } = req.params;
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startISO = start.toISOString().slice(0, 19).replace('T', ' ') + '+00:00';
    const endISO = now.toISOString().slice(0, 19).replace('T', ' ') + '+00:00';

    // Active Users per hour
    const activeUsersResult = await pool.query(
      `SELECT to_char(date_trunc('hour', s."startTime"), 'YYYY-MM-DD HH24:00') as hour,
              COUNT(DISTINCT s."playerId") as active_users
       FROM sessions s
       WHERE s."gameId" = $1
         AND s."startTime" >= $2 AND s."startTime" <= $3
       GROUP BY hour
       ORDER BY hour ASC`,
      [gameId, startISO, endISO]
    );

    // New Users per hour (first session in last 24h)
    const newUsersResult = await pool.query(
      `SELECT to_char(date_trunc('hour', first_session), 'YYYY-MM-DD HH24:00') as hour,
              COUNT(*) as new_users
       FROM (
         SELECT s."playerId", MIN(s."startTime") as first_session
         FROM sessions s
         WHERE s."gameId" = $1
         GROUP BY s."playerId"
       ) t
       WHERE first_session >= $2 AND first_session <= $3
       GROUP BY hour
       ORDER BY hour ASC`,
      [gameId, startISO, endISO]
    );

    // Returning Users per hour (not new, but session in last 24h)
    const returningUsersResult = await pool.query(
      `SELECT to_char(date_trunc('hour', s."startTime"), 'YYYY-MM-DD HH24:00') as hour,
              COUNT(DISTINCT s."playerId") as returning_users
       FROM sessions s
       WHERE s."gameId" = $1
         AND s."startTime" >= $2 AND s."startTime" <= $3
         AND EXISTS (
           SELECT 1 FROM sessions s2
           WHERE s2."gameId" = s."gameId"
             AND s2."playerId" = s."playerId"
             AND s2."startTime" < $2
         )
       GROUP BY hour
       ORDER BY hour ASC`,
      [gameId, startISO, endISO]
    );

    // Revenue per hour
    const revenueResult = await pool.query(
      `SELECT to_char(date_trunc('hour', m.timestamp), 'YYYY-MM-DD HH24:00') as hour,
              COALESCE(SUM(CAST(m.amount AS DECIMAL(10,2))), 0) as revenue
       FROM monetization m
       WHERE m."gameId" = $1
         AND m.timestamp >= $2 AND m.timestamp <= $3
       GROUP BY hour
       ORDER BY hour ASC`,
      [gameId, startISO, endISO]
    );

    // Transactions per hour
    const transactionsResult = await pool.query(
      `SELECT to_char(date_trunc('hour', m.timestamp), 'YYYY-MM-DD HH24:00') as hour,
              COUNT(*) as transactions
       FROM monetization m
       WHERE m."gameId" = $1
         AND m.timestamp >= $2 AND m.timestamp <= $3
       GROUP BY hour
       ORDER BY hour ASC`,
      [gameId, startISO, endISO]
    );

    // Session Count per hour
    const sessionCountResult = await pool.query(
      `SELECT to_char(date_trunc('hour', s."startTime"), 'YYYY-MM-DD HH24:00') as hour,
              COUNT(*) as session_count
       FROM sessions s
       WHERE s."gameId" = $1
         AND s."startTime" >= $2 AND s."startTime" <= $3
       GROUP BY hour
       ORDER BY hour ASC`,
      [gameId, startISO, endISO]
    );

    // Saat dizisini oluştur (eksik saatlerde 0 gösterilsin)
    const hours: string[] = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(start.getTime() + i * 60 * 60 * 1000);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const hour = String(d.getUTCHours()).padStart(2, '0');
      hours.push(`${year}-${month}-${day} ${hour}:00`);
    }
    function mapByHour(result: any, key: string): number[] {
      const map: Record<string, number> = {};
      for (const row of result.rows) map[row.hour] = Number(row[key]);
      return hours.map(hour => map[hour] || 0);
    }
    const response = {
      active_users: mapByHour(activeUsersResult, 'active_users'),
      new_users: mapByHour(newUsersResult, 'new_users'),
      returning_users: mapByHour(returningUsersResult, 'returning_users'),
      revenue: mapByHour(revenueResult, 'revenue'),
      transactions: mapByHour(transactionsResult, 'transactions'),
      session_count: mapByHour(sessionCountResult, 'session_count'),
      hours
    };
    res.json(response);
  } catch (error) {
    console.error('Realtime metrics error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: 'Realtime metrics error: ' + error.message });
    } else {
      res.status(500).json({ error: 'Realtime metrics error: ' + String(error) });
    }
  }
});

// Unique filter values endpoint
router.get('/filters/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    // Unique device models
    const deviceResult = await pool.query(
      'SELECT DISTINCT "deviceModel" FROM devices WHERE "gameId" = $1',
      [gameId]
    );
    // Unique gameVersions (oyun versiyonları)
    const versionResult = await pool.query(
      'SELECT DISTINCT "gameVersion" FROM sessions WHERE "gameId" = $1 AND "gameVersion" IS NOT NULL',
      [gameId]
    );
    // Unique countries
    const countryResult = await pool.query(
      'SELECT DISTINCT country FROM devices WHERE "gameId" = $1',
      [gameId]
    );
    // Unique platforms
    const platformResult = await pool.query(
      'SELECT DISTINCT platform FROM devices WHERE "gameId" = $1',
      [gameId]
    );
    res.json({
      devices: deviceResult.rows.map(r => r.deviceModel).filter(Boolean),
      versions: versionResult.rows.map(r => r.gameVersion).filter(Boolean),
      countries: countryResult.rows.map(r => r.country).filter(Boolean),
      platforms: platformResult.rows.map(r => r.platform).filter(Boolean)
    });
  } catch (error) {
    const err = error as Error;
    console.error('Filter values error:', err);
    res.status(500).json({ error: 'Filter values error: ' + err.message });
  }
});

// Progression metrics endpoint
router.get('/progression/:gameId', async (req, res) => {
  const { gameId } = req.params;
  let { startDate, endDate, country, platform, version, device, playerId } = req.query;

  // Eğer startDate veya endDate yoksa son 7 günü kullan
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  startDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
  endDate = (endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd;
  // endDate'i bir gün ileriye çek (exclusive)
  const endDateObj = new Date(endDate);
  endDateObj.setDate(endDateObj.getDate() + 1);
  const safeEndDate = endDateObj.toISOString().slice(0, 10);

  // Filtre parametrelerini normalize et (Overview/Engagement ile aynı mantık)
  const countryParam = !country || country === 'all' ? null : country;
  const versionParam = !version || version === 'all' ? null : version;
  const deviceParam = !device || device === 'all' ? null : device;
  const platformParam = !platform || platform === 'all' ? null : platform;
  const playerIdParam = !playerId || playerId === 'all' ? null : playerId;

  // Previous period calculation
  const periodDays = Math.ceil((new Date(safeEndDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const prevStartDate = new Date(new Date(startDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const prevEndDate = startDate;
  const prevEndDateObj = new Date(prevEndDate);
  prevEndDateObj.setDate(prevEndDateObj.getDate() + 1);
  const safePrevEndDate = prevEndDateObj.toISOString().slice(0, 10);

  // Main query for current period
  const query = `
    SELECT 
      p."levelNumber" as "levelNumber",
      COUNT(*) as "totalAttempts",
      SUM(CASE WHEN p."completionStatus" = 'completed' THEN 1 ELSE 0 END) as "completedAttempts",
      AVG(EXTRACT(EPOCH FROM (p."endTime" - p."startTime"))) as "avgCompletionTime",
      COUNT(DISTINCT p."playerId") as "uniquePlayers",
      AVG(p.score) as "avgScore",
      AVG(p.stars) as "avgStars",
      AVG(p.attempts) as "avgAttempts",
      SUM(CASE WHEN p."completionStatus" = 'failed' THEN 1 ELSE 0 END) as "failedAttempts"
    FROM progression p
    JOIN devices d ON d."playerId" = p."playerId" AND d."gameId" = p."gameId"
    WHERE p."gameId" = $1
      AND p."startTime" >= $2::date
      AND p."startTime" < $3::date
      AND ($4::text IS NULL OR d.country = $4::text)
      AND ($5::text IS NULL OR d.platform = $5::text)
      AND ($6::text IS NULL OR d."deviceModel" = $6::text)
      AND ($7::text IS NULL OR p."playerId" = $7::int)
    GROUP BY p."levelNumber"
    ORDER BY p."levelNumber";
  `;
  const params = [
    String(gameId),
    startDate,
    safeEndDate,
    countryParam || null,
    platformParam || null,
    deviceParam || null,
    playerIdParam || null
  ];

  // Previous period query
  const prevQuery = `
    SELECT 
      p."levelNumber" as "levelNumber",
      COUNT(*) as "totalAttempts",
      SUM(CASE WHEN p."completionStatus" = 'completed' THEN 1 ELSE 0 END) as "completedAttempts"
    FROM progression p
    JOIN devices d ON d."playerId" = p."playerId" AND d."gameId" = p."gameId"
    WHERE p."gameId" = $1
      AND p."startTime" >= $2::date
      AND p."startTime" < $3::date
      AND ($4::text IS NULL OR d.country = $4::text)
      AND ($5::text IS NULL OR d.platform = $5::text)
      AND ($6::text IS NULL OR d."deviceModel" = $6::text)
      AND ($7::text IS NULL OR p."playerId" = $7::int)
    GROUP BY p."levelNumber"
    ORDER BY p."levelNumber";
  `;
  const prevParams = [
    String(gameId),
    prevStartDate,
    safePrevEndDate,
    countryParam || null,
    platformParam || null,
    deviceParam || null,
    playerIdParam || null
  ];

  // Funnel: users who started, completed, failed each level
  const funnelQuery = `
    SELECT 
      p."levelNumber" as "levelNumber",
      COALESCE(COUNT(DISTINCT CASE WHEN p."completionStatus" = 'started' THEN p."playerId" END), 0) as "startedUsers",
      COALESCE(COUNT(DISTINCT CASE WHEN p."completionStatus" = 'completed' THEN p."playerId" END), 0) as "completedUsers",
      COALESCE(COUNT(DISTINCT CASE WHEN p."completionStatus" = 'failed' THEN p."playerId" END), 0) as "failedUsers"
    FROM progression p
    JOIN devices d ON d."playerId" = p."playerId" AND d."gameId" = p."gameId"
    WHERE p."gameId" = $1
      AND p."startTime" >= $2::date
      AND p."startTime" < $3::date
      AND ($4::text IS NULL OR d.country = $4::text)
      AND ($5::text IS NULL OR d.platform = $5::text)
      AND ($6::text IS NULL OR d."deviceModel" = $6::text)
      AND ($7::text IS NULL OR p."playerId" = $7::int)
    GROUP BY p."levelNumber"
    ORDER BY p."levelNumber";
  `;

  try {
    const [result, prevResult, funnelResult] = await Promise.all([
      pool.query(query, params),
      pool.query(prevQuery, prevParams),
      pool.query(funnelQuery, params)
    ]);
    // Map previous period completion rates by level
    const prevMap: Record<number, number> = {};
    for (const row of prevResult.rows) {
      const prevRate = row.totalAttempts > 0 ? (row.completedAttempts / row.totalAttempts) * 100 : 0;
      prevMap[row.levelNumber] = prevRate;
    }
    // Build levels array
    const levels = result.rows.map(row => ({
      levelNumber: Number(row.levelNumber),
      completionRate: row.totalAttempts > 0 ? (Number(row.completedAttempts) / Number(row.totalAttempts)) * 100 : 0,
      completionRatePrev: prevMap[Number(row.levelNumber)] ?? 0,
      avgCompletionTime: Number(row.avgCompletionTime) || 0,
      uniquePlayers: Number(row.uniquePlayers) || 0,
      avgScore: Number(row.avgScore) || 0,
      avgStars: Number(row.avgStars) || 0,
      avgAttempts: Number(row.avgAttempts) || 0,
      failRate: row.totalAttempts > 0 ? (Number(row.failedAttempts) / Number(row.totalAttempts)) * 100 : 0
    }));
    // Build funnel array
    const funnel = funnelResult.rows.map(row => ([
      { step: `Level ${row.levelNumber} Started`, users: Number(row.startedUsers) },
      { step: `Level ${row.levelNumber} Completed`, users: Number(row.completedUsers) },
      { step: `Level ${row.levelNumber} Failed`, users: Number(row.failedUsers) }
    ])).flat();
    res.json({ levels, funnel });
  } catch (error) {
    console.error('Error fetching progression metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Progression filters endpoint (same as Engagement/Overview)
router.get('/metrics/filters/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const deviceResult = await pool.query('SELECT DISTINCT "deviceModel" FROM devices WHERE "gameId" = $1', [gameId]);
    const versionResult = await pool.query('SELECT DISTINCT "gameVersion" FROM sessions WHERE "gameId" = $1 AND "gameVersion" IS NOT NULL', [gameId]);
    const countryResult = await pool.query('SELECT DISTINCT country FROM devices WHERE "gameId" = $1', [gameId]);
    const platformResult = await pool.query('SELECT DISTINCT platform FROM devices WHERE "gameId" = $1', [gameId]);
    res.json({
      devices: deviceResult.rows.map(r => r.deviceModel).filter(Boolean),
      versions: versionResult.rows.map(r => r.gameVersion).filter(Boolean),
      countries: countryResult.rows.map(r => r.country).filter(Boolean),
      platforms: platformResult.rows.map(r => r.platform).filter(Boolean)
    });
  } catch (error) {
    const err = error as Error;
    console.error('Progression filter values error:', err);
    res.status(500).json({ error: 'Progression filter values error: ' + err.message });
  }
});

// Monetization metrics endpoint
router.get('/monetization/:gameId', async (req, res) => {
  const { gameId } = req.params;
  let { startDate, endDate, country, platform, version, device, playerId } = req.query;

  // Eğer startDate veya endDate yoksa son 7 günü kullan
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  startDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
  endDate = (endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd;
  // endDate'i bir gün ileriye çek (exclusive)
  const endDateObj = new Date(endDate);
  endDateObj.setDate(endDateObj.getDate() + 1);
  const safeEndDate = endDateObj.toISOString().slice(0, 10);

  // Filtre parametrelerini normalize et (Overview/Engagement ile aynı mantık)
  const countryParam = !country || country === 'all' ? null : country;
  const versionParam = !version || version === 'all' ? null : version;
  const deviceParam = !device || device === 'all' ? null : device;
  const platformParam = !platform || platform === 'all' ? null : platform;
  const playerIdParam = !playerId || playerId === 'all' ? null : playerId;

  try {
    // Toplam gelir
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(CAST(m.amount AS DECIMAL(10,2))), 0) as totalRevenue
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
       JOIN games g ON g.id = m."gameId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR m."playerId" = $8::int)
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0]?.totalrevenue || 0);

    // Satın alma sayısı
    const purchaseCountResult = await pool.query(
      `SELECT COUNT(*) as purchase_count
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
       JOIN games g ON g.id = m."gameId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR m."playerId" = $8::int)
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const purchaseCount = parseInt(purchaseCountResult.rows[0]?.purchase_count || 0);

    // MAU (ödeme yapan ve toplam)
    const mauResult = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as mau
      FROM sessions s
      JOIN devices d ON d."playerId" = s."playerId"
       JOIN games g ON g.id = s."gameId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR s."playerId" = $8::int)
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const mau = parseInt(mauResult.rows[0]?.mau || 0);

    const payingUsersResult = await pool.query(
      `SELECT COUNT(DISTINCT m."playerId") as paying_users
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
       JOIN games g ON g.id = m."gameId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR m."playerId" = $8::int)
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const payingUsers = parseInt(payingUsersResult.rows[0]?.paying_users || 0);

    // ARPU, ARPPU, LTV
    const arpu = mau > 0 ? totalRevenue / mau : 0;
    const arppu = payingUsers > 0 ? totalRevenue / payingUsers : 0;
    const ltv = arpu; // Basit LTV: ARPU ile aynı (daha gelişmişi için cohort gerekir)

    // Zaman serisi (revenue_chart)
    const revenueChartResult = await pool.query(
      `SELECT m.timestamp::date as date, SUM(CAST(m.amount AS DECIMAL(10,2))) as revenue
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
       JOIN games g ON g.id = m."gameId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR m."playerId" = $8::int)
       GROUP BY m.timestamp::date
       ORDER BY date ASC
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const revenue_chart = revenueChartResult.rows.map(r => ({ date: r.date, value: parseFloat(r.revenue) }));

    // Ürün bazlı breakdown
    const productBreakdownResult = await pool.query(
      `SELECT m."productId" as product_id, SUM(CAST(m.amount AS DECIMAL(10,2))) as revenue, COUNT(*) as count
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
       JOIN games g ON g.id = m."gameId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR m."playerId" = $8::int)
       GROUP BY m."productId"
       ORDER BY revenue DESC
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const product_breakdown = productBreakdownResult.rows.map(r => ({ product_id: r.product_id, revenue: parseFloat(r.revenue), count: parseInt(r.count) }));

    res.json({
      summary: {
        total_revenue: totalRevenue,
        arpu,
        arppu,
        ltv,
        purchase_count: purchaseCount
      },
      revenue_chart,
      product_breakdown
    });
  } catch (error) {
    console.error('Monetization metrics error:', error);
    res.status(500).json({ error: 'Monetization metrics error: ' + (error instanceof Error ? error.message : String(error)) });
  }
});

// Paying User Trend endpoint
router.get('/monetization/:gameId/paying-user-trend', async (req, res) => {
  const { gameId } = req.params;
  let { startDate, endDate, country, platform, version, device, playerId } = req.query;

  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  startDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
  endDate = (endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd;
  const endDateObj = new Date(endDate);
  endDateObj.setDate(endDateObj.getDate() + 1);
  const safeEndDate = endDateObj.toISOString().slice(0, 10);

  const countryParam = !country || country === 'all' ? null : country;
  const versionParam = !version || version === 'all' ? null : version;
  const deviceParam = !device || device === 'all' ? null : device;
  const platformParam = !platform || platform === 'all' ? null : platform;
  const playerIdParam = !playerId || playerId === 'all' ? null : playerId;

  try {
    const result = await pool.query(
      `SELECT m.timestamp::date as date, COUNT(DISTINCT m."playerId") as paying_users
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId" AND d."gameId" = m."gameId"
       JOIN games g ON g.id = m."gameId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR g."gameVersion" = $6::text)
         AND ($7::text IS NULL OR d."deviceModel" = $7::text)
         AND ($8::text IS NULL OR m."playerId" = $8::int)
       GROUP BY m.timestamp::date
       ORDER BY date ASC
      `,
      [
        String(gameId),
        startDate,
        safeEndDate,
        countryParam,
        platformParam,
        versionParam,
        deviceParam,
        playerIdParam
      ]
    );
    const paying_user_trend = result.rows.map(r => ({ date: r.date, paying_users: parseInt(r.paying_users) }));
    res.json({ paying_user_trend });
  } catch (error) {
    console.error('Paying user trend error:', error);
    res.status(500).json({ error: 'Paying user trend error: ' + (error instanceof Error ? error.message : String(error)) });
  }
});

// User Analysis metrics endpoint
router.get('/user-analysis/:gameId', async (req, res) => {
  const { gameId } = req.params;
  let { startDate, endDate, country, platform, version, device, playerId } = req.query;

  // Default date range: last 30 days
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  startDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
  endDate = (endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd;
  const endDateObj = new Date(endDate);
  endDateObj.setDate(endDateObj.getDate() + 1);
  const safeEndDate = endDateObj.toISOString().slice(0, 10);

  // Normalize filters
  const countryParam = !country || country === 'all' ? null : country;
  const versionParam = !version || version === 'all' ? null : version;
  const deviceParam = !device || device === 'all' ? null : device;
  const platformParam = !platform || platform === 'all' ? null : platform;
  const playerIdParam = !playerId || playerId === 'all' ? null : playerId;

  try {
    // 1. Demographics
    const countryDistribution = await pool.query(
      `SELECT d.country, COUNT(DISTINCT s."playerId") as user_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
       GROUP BY d.country
       ORDER BY user_count DESC`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    const platformDistribution = await pool.query(
      `SELECT d.platform, COUNT(DISTINCT s."playerId") as user_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
       GROUP BY d.platform
       ORDER BY user_count DESC`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    const deviceDistribution = await pool.query(
      `SELECT d."deviceModel", COUNT(DISTINCT s."playerId") as user_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
       GROUP BY d."deviceModel"
       ORDER BY user_count DESC`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 2. User Behavior
    const avgSessionDuration = await pool.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as avg_duration
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND s."endTime" IS NOT NULL
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    const sessionsPerUser = await pool.query(
      `SELECT s."playerId", COUNT(*) as session_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
       GROUP BY s."playerId"`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 3. User Segmentation
    const newUsers = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as new_users
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
         AND NOT EXISTS (
           SELECT 1 FROM sessions s2
           WHERE s2."gameId" = s."gameId"
             AND s2."playerId" = s."playerId"
             AND s2."startTime" < $2::date
         )`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    const payingUsers = await pool.query(
      `SELECT COUNT(DISTINCT m."playerId") as paying_users
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR m."playerId" = $7::int)`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 4. User Lifecycle
    const userLifecycle = await pool.query(
      `WITH user_metrics AS (
        SELECT
          s."playerId",
           MIN(s."startTime") as first_session,
           MAX(s."startTime") as last_session,
           COUNT(DISTINCT s.id) as total_sessions,
           SUM(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))) as total_playtime,
           COUNT(DISTINCT m.id) as total_purchases,
           COALESCE(SUM(m.amount), 0) as total_spent
        FROM sessions s
         LEFT JOIN monetization m ON m."playerId" = s."playerId" AND m."gameId" = s."gameId"
        JOIN devices d ON d."playerId" = s."playerId"
         WHERE s."gameId" = $1
           AND s."startTime" >= $2::date AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR d."deviceModel" = $6::text)
           AND ($7::text IS NULL OR s."playerId" = $7::int)
        GROUP BY s."playerId"
      )
      SELECT
         COUNT(*) as total_users,
         AVG(total_sessions) as avg_sessions,
         AVG(total_playtime) as avg_playtime,
         AVG(total_purchases) as avg_purchases,
         AVG(total_spent) as avg_spent
       FROM user_metrics`,
      [gameId, startDate, safeEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // --- PREVIOUS PERIOD CALCULATIONS ---
    // Calculate previous period date range
    const periodDays = Math.ceil((new Date(safeEndDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(startDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const prevEndDate = startDate;
    const prevEndDateObj = new Date(prevEndDate);
    prevEndDateObj.setDate(prevEndDateObj.getDate() + 1);
    const safePrevEndDate = prevEndDateObj.toISOString().slice(0, 10);

    // Previous period queries
    // 1. User Lifecycle (total users)
    const userLifecyclePrev = await pool.query(
      `WITH user_metrics AS (
      SELECT 
        s."playerId",
           MIN(s."startTime") as first_session,
           MAX(s."startTime") as last_session,
           COUNT(DISTINCT s.id) as total_sessions,
           SUM(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))) as total_playtime,
           COUNT(DISTINCT m.id) as total_purchases,
           COALESCE(SUM(m.amount), 0) as total_spent
      FROM sessions s
         LEFT JOIN monetization m ON m."playerId" = s."playerId" AND m."gameId" = s."gameId"
      JOIN devices d ON d."playerId" = s."playerId"
      WHERE s."gameId" = $1
           AND s."startTime" >= $2::date AND s."startTime" < $3::date
           AND ($4::text IS NULL OR d.country = $4::text)
           AND ($5::text IS NULL OR d.platform = $5::text)
           AND ($6::text IS NULL OR d."deviceModel" = $6::text)
           AND ($7::text IS NULL OR s."playerId" = $7::int)
         GROUP BY s."playerId"
       )
       SELECT 
         COUNT(*) as total_users,
         AVG(total_sessions) as avg_sessions,
         AVG(total_playtime) as avg_playtime,
         AVG(total_purchases) as avg_purchases,
         AVG(total_spent) as avg_spent
       FROM user_metrics`,
      [gameId, prevStartDate, safePrevEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 2. New Users (prev)
    const newUsersPrev = await pool.query(
      `SELECT COUNT(DISTINCT s."playerId") as new_users
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
         AND NOT EXISTS (
           SELECT 1 FROM sessions s2
           WHERE s2."gameId" = s."gameId"
             AND s2."playerId" = s."playerId"
             AND s2."startTime" < $2::date
         )`,
      [gameId, prevStartDate, safePrevEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 3. Paying Users (prev)
    const payingUsersPrev = await pool.query(
      `SELECT COUNT(DISTINCT m."playerId") as paying_users
       FROM monetization m
       JOIN devices d ON d."playerId" = m."playerId"
       WHERE m."gameId" = $1
         AND m.timestamp::date >= $2::date AND m.timestamp::date < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR m."playerId" = $7::int)`,
      [gameId, prevStartDate, safePrevEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 4. Avg. Session Duration (prev)
    const avgSessionDurationPrev = await pool.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as avg_duration
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND s."endTime" IS NOT NULL
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)`,
      [gameId, prevStartDate, safePrevEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );

    // 5. Avg. Sessions/User (prev)
    const sessionsPerUserPrev = await pool.query(
      `SELECT s."playerId", COUNT(*) as session_count
       FROM sessions s
       JOIN devices d ON d."playerId" = s."playerId"
       WHERE s."gameId" = $1
         AND s."startTime" >= $2::date AND s."startTime" < $3::date
         AND ($4::text IS NULL OR d.country = $4::text)
         AND ($5::text IS NULL OR d.platform = $5::text)
         AND ($6::text IS NULL OR d."deviceModel" = $6::text)
         AND ($7::text IS NULL OR s."playerId" = $7::int)
       GROUP BY s."playerId"`,
      [gameId, prevStartDate, safePrevEndDate, countryParam, platformParam, deviceParam, playerIdParam]
    );
    const avgSessionsPerUserPrev = sessionsPerUserPrev.rows.length > 0 
      ? sessionsPerUserPrev.rows.reduce((acc, curr) => acc + Number(curr.session_count), 0) / sessionsPerUserPrev.rows.length 
      : 0;

    // Response
    res.json({
      demographics: {
        countryDistribution: countryDistribution.rows,
        platformDistribution: platformDistribution.rows,
        deviceDistribution: deviceDistribution.rows
      },
      behavior: {
        avgSessionDuration: Math.round(parseFloat(avgSessionDuration.rows[0]?.avg_duration || 0)),
        avgSessionDurationPrev: Math.round(parseFloat(avgSessionDurationPrev.rows[0]?.avg_duration || 0)),
        avgSessionsPerUser: sessionsPerUser.rows.length > 0 
          ? sessionsPerUser.rows.reduce((acc, curr) => acc + Number(curr.session_count), 0) / sessionsPerUser.rows.length 
          : 0,
        avgSessionsPerUserPrev: avgSessionsPerUserPrev
      },
      segmentation: {
        newUsers: parseInt(newUsers.rows[0]?.new_users || 0),
        newUsersPrev: parseInt(newUsersPrev.rows[0]?.new_users || 0),
        payingUsers: parseInt(payingUsers.rows[0]?.paying_users || 0),
        payingUsersPrev: parseInt(payingUsersPrev.rows[0]?.paying_users || 0)
      },
      lifecycle: {
        totalUsers: parseInt(userLifecycle.rows[0]?.total_users || 0),
        totalUsersPrev: parseInt(userLifecyclePrev.rows[0]?.total_users || 0),
        avgSessions: parseFloat(userLifecycle.rows[0]?.avg_sessions || 0),
        avgPlaytime: Math.round(parseFloat(userLifecycle.rows[0]?.avg_playtime || 0)),
        avgPurchases: parseFloat(userLifecycle.rows[0]?.avg_purchases || 0),
        avgSpent: parseFloat(userLifecycle.rows[0]?.avg_spent || 0)
      }
    });
  } catch (error) {
    console.error('User analysis error:', error);
    res.status(500).json({ error: 'User analysis error: ' + (error instanceof Error ? error.message : String(error)) });
  }
});

// Performance metrics endpoint
router.get('/performance/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { startDate, endDate, country, version, platform, device, playerId } = req.query;

    // Get current period data
    const currentData = await getPerformanceData(
      String(gameId),
      typeof startDate === 'string' ? startDate : '',
      typeof endDate === 'string' ? endDate : '',
      typeof country === 'string' ? country : undefined,
      typeof version === 'string' ? version : undefined,
      typeof platform === 'string' ? platform : undefined,
      typeof device === 'string' ? device : undefined,
      typeof playerId === 'string' ? playerId : undefined
    );

    // Get previous period data for comparison
    const currentStart = new Date(startDate as string);
    const currentEnd = new Date(endDate as string);
    const periodDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - periodDays);
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevData = await getPerformanceData(
      String(gameId),
      prevStart.toISOString().split('T')[0],
      prevEnd.toISOString().split('T')[0],
      typeof country === 'string' ? country : undefined,
      typeof version === 'string' ? version : undefined,
      typeof platform === 'string' ? platform : undefined,
      typeof device === 'string' ? device : undefined,
      typeof playerId === 'string' ? playerId : undefined
    );

    // Calculate rates with proper handling
    const calculateRate = (current: number, total: number) => {
      if (!total) return 0;
      const rate = (current / total) * 100;
      return Math.min(rate, 100); // Cap at 100%
    };

    const response = {
      crashRate: calculateRate(currentData.crash_count, currentData.total_sessions),
      errorRate: calculateRate(currentData.error_count, currentData.total_sessions),
      avgSessionDuration: currentData.total_duration / currentData.total_sessions || 0,
      crashTrend: currentData.crash_trend,
      errorTrend: currentData.error_trend,
      deviceCrashTable: currentData.device_crash_table,
      platformCrashTable: currentData.platform_crash_table,
      // Add prev values for comparison
      prev: {
        crashRate: calculateRate(prevData.crash_count, prevData.total_sessions),
        errorRate: calculateRate(prevData.error_count, prevData.total_sessions),
        avgSessionDuration: prevData.total_duration / prevData.total_sessions || 0
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Performance metrics error:', error, error.stack);
      res.status(500).json({ 
        error: 'Performance metrics error: ' + error.message,
        stack: error.stack 
      });
    } else {
      console.error('Performance metrics error:', error);
      res.status(500).json({ 
        error: 'Performance metrics error: ' + String(error)
      });
    }
  }
});

// Helper function to get performance data
async function getPerformanceData(gameId: string, startDate: string, endDate: string, country?: string, version?: string, platform?: string, device?: string, playerId?: string) {
  // Convert dates to timestamps
  const startTimestamp = new Date(startDate).toISOString();
  const endTimestamp = new Date(endDate).toISOString();

  const query = `
    WITH session_stats AS (
      SELECT 
        COUNT(DISTINCT s.id) as total_sessions,
        COALESCE(SUM(EXTRACT(EPOCH FROM (s."endTime" - s."startTime"))), 0) as total_duration,
        COUNT(DISTINCT CASE WHEN e."eventType" = 'crash' THEN e.id END) as crash_count,
        COUNT(DISTINCT CASE WHEN e."eventType" = 'error' THEN e.id END) as error_count
      FROM sessions s
      LEFT JOIN events e ON s.id = e."sessionId" AND e."eventType" IN ('crash', 'error')
      JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
      WHERE s."gameId" = $1
        AND s."startTime" >= $2::timestamp
        AND s."startTime" < $3::timestamp
        AND ($4::text IS NULL OR d.country = $4)
        AND ($5::text IS NULL OR s."gameVersion" = $5)
        AND ($6::text IS NULL OR d.platform = $6)
        AND ($7::text IS NULL OR d."deviceModel" = $7)
        AND ($8::text IS NULL OR s."playerId" = $8::int)
    ),
    crash_trend AS (
      SELECT 
        DATE_TRUNC('day', e.timestamp) as date,
        COUNT(DISTINCT e.id) as count
      FROM events e
      JOIN sessions s ON e."sessionId" = s.id
      JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
      WHERE e."eventType" = 'crash'
        AND s."gameId" = $1
        AND e.timestamp >= $2::timestamp
        AND e.timestamp < $3::timestamp
        AND ($4::text IS NULL OR d.country = $4)
        AND ($5::text IS NULL OR s."gameVersion" = $5)
        AND ($6::text IS NULL OR d.platform = $6)
        AND ($7::text IS NULL OR d."deviceModel" = $7)
        AND ($8::text IS NULL OR s."playerId" = $8::int)
      GROUP BY DATE_TRUNC('day', e.timestamp)
      ORDER BY date
    ),
    error_trend AS (
      SELECT 
        DATE_TRUNC('day', e.timestamp) as date,
        COUNT(DISTINCT e.id) as count
      FROM events e
      JOIN sessions s ON e."sessionId" = s.id
      JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
      WHERE e."eventType" = 'error'
        AND s."gameId" = $1
        AND e.timestamp >= $2::timestamp
        AND e.timestamp < $3::timestamp
        AND ($4::text IS NULL OR d.country = $4)
        AND ($5::text IS NULL OR s."gameVersion" = $5)
        AND ($6::text IS NULL OR d.platform = $6)
        AND ($7::text IS NULL OR d."deviceModel" = $7)
        AND ($8::text IS NULL OR s."playerId" = $8::int)
      GROUP BY DATE_TRUNC('day', e.timestamp)
      ORDER BY date
    ),
    device_crashes AS (
      SELECT 
        d."deviceModel" as device,
        COUNT(DISTINCT e.id) as count
      FROM events e
      JOIN sessions s ON e."sessionId" = s.id
      JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
      WHERE e."eventType" = 'crash'
        AND s."gameId" = $1
        AND e.timestamp >= $2::timestamp
        AND e.timestamp < $3::timestamp
        AND ($4::text IS NULL OR d.country = $4)
        AND ($5::text IS NULL OR s."gameVersion" = $5)
        AND ($6::text IS NULL OR d.platform = $6)
        AND ($7::text IS NULL OR d."deviceModel" = $7)
        AND ($8::text IS NULL OR s."playerId" = $8::int)
      GROUP BY d."deviceModel"
      ORDER BY count DESC
    ),
    platform_crashes AS (
      SELECT 
        d.platform,
        COUNT(DISTINCT e.id) as count
      FROM events e
      JOIN sessions s ON e."sessionId" = s.id
      JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
      WHERE e."eventType" = 'crash'
        AND s."gameId" = $1
        AND e.timestamp >= $2::timestamp
        AND e.timestamp < $3::timestamp
        AND ($4::text IS NULL OR d.country = $4)
        AND ($5::text IS NULL OR s."gameVersion" = $5)
        AND ($6::text IS NULL OR d.platform = $6)
        AND ($7::text IS NULL OR d."deviceModel" = $7)
        AND ($8::text IS NULL OR s."playerId" = $8::int)
      GROUP BY d.platform
      ORDER BY count DESC
    )
    SELECT 
      ss.total_sessions,
      ss.total_duration,
      ss.crash_count,
      ss.error_count,
      COALESCE(json_agg(ct.*) FILTER (WHERE ct.date IS NOT NULL), '[]') as crash_trend,
      COALESCE(json_agg(et.*) FILTER (WHERE et.date IS NOT NULL), '[]') as error_trend,
      COALESCE(json_agg(dc.*) FILTER (WHERE dc.device IS NOT NULL), '[]') as device_crash_table,
      COALESCE(json_agg(pc.*) FILTER (WHERE pc.platform IS NOT NULL), '[]') as platform_crash_table
    FROM session_stats ss
    LEFT JOIN crash_trend ct ON true
    LEFT JOIN error_trend et ON true
    LEFT JOIN device_crashes dc ON true
    LEFT JOIN platform_crashes pc ON true
    GROUP BY ss.total_sessions, ss.total_duration, ss.crash_count, ss.error_count
  `;

  const result = await pool.query(query, [gameId, startTimestamp, endTimestamp, country, version, platform, device, playerId]);
  console.log('[PERFORMANCE getPerformanceData SQL result]', result.rows[0]);
  return result.rows[0];
}

// Events metrics endpoint
router.get('/events/:gameId', async (req, res) => {
  const { gameId } = req.params;
  const { startDate, endDate, eventType, eventName, platform, device, country, version, playerId } = req.query;

  // Tarih aralığı default: son 7 gün
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const safeStartDate = (startDate && typeof startDate === 'string' && startDate.trim() !== '') ? startDate : defaultStart;
  const safeEndDateObj = new Date((endDate && typeof endDate === 'string' && endDate.trim() !== '') ? endDate : defaultEnd);
  safeEndDateObj.setDate(safeEndDateObj.getDate() + 1);
  const safeEndDate = safeEndDateObj.toISOString().slice(0, 10);

  // Önceki dönem hesaplama
  const periodDays = Math.ceil((new Date(safeEndDate).getTime() - new Date(safeStartDate).getTime()) / (1000 * 60 * 60 * 24));
  const prevStartDate = new Date(new Date(safeStartDate).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const prevEndDate = safeStartDate;

  // Filtre parametrelerini normalize et
  const eventTypeParam = !eventType || eventType === 'all' ? null : eventType;
  const eventNameParam = !eventName || eventName === 'all' ? null : eventName;
  const platformParam = !platform || platform === 'all' ? null : platform;
  const deviceParam = !device || device === 'all' ? null : device;
  const countryParam = !country || country === 'all' ? null : country;
  const versionParam = !version || version === 'all' ? null : version;
  const playerIdParam = !playerId || playerId === 'all' ? null : playerId;

  try {
    // Toplam event sayısı (mevcut dönem)
    const totalEventsResult = await pool.query(
      `SELECT COUNT(*) as total FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
      `,
      [gameId, safeStartDate, safeEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );
    const totalEvents = parseInt(totalEventsResult.rows[0]?.total || 0);

    // Toplam event sayısı (önceki dönem)
    const totalEventsPrevResult = await pool.query(
      `SELECT COUNT(*) as total FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
      `,
      [gameId, prevStartDate, prevEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );
    const totalEventsPrev = parseInt(totalEventsPrevResult.rows[0]?.total || 0);

    // Event türüne göre dağılım
    const typeDistResult = await pool.query(
      `SELECT e."eventType", COUNT(*) as count
       FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
       GROUP BY e."eventType"
       ORDER BY count DESC
      `,
      [gameId, safeStartDate, safeEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );

    // Zaman serisi (trend)
    const trendResult = await pool.query(
      `SELECT e.timestamp::date as date, COUNT(*) as count
       FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
       GROUP BY e.timestamp::date
       ORDER BY date ASC
      `,
      [gameId, safeStartDate, safeEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );

    // En sık eventler (eventName/id)
    const topEventsResult = await pool.query(
      `SELECT e."eventName", COUNT(*) as count
       FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
       GROUP BY e."eventName"
       ORDER BY count DESC
       LIMIT 20
      `,
      [gameId, safeStartDate, safeEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );

    // Platform breakdown
    const platformResult = await pool.query(
      `SELECT d.platform, COUNT(*) as count
       FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
       GROUP BY d.platform
       ORDER BY count DESC
      `,
      [gameId, safeStartDate, safeEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );

    // Country breakdown (filtre uygulanırsa sadece seçili ülke döner)
    const countryResult = await pool.query(
      `SELECT d.country, COUNT(*) as count
       FROM events e
       JOIN sessions s ON e."sessionId" = s.id
       JOIN devices d ON d."playerId" = s."playerId" AND d."gameId" = s."gameId"
       WHERE s."gameId" = $1
         AND e.timestamp >= $2::date AND e.timestamp < $3::date
         AND ($4::text IS NULL OR e."eventType" = $4)
         AND ($5::text IS NULL OR e."eventName" = $5)
         AND ($6::text IS NULL OR d.platform = $6)
         AND ($7::text IS NULL OR d."deviceModel" = $7)
         AND ($8::text IS NULL OR d.country = $8)
         AND ($9::text IS NULL OR s."gameVersion" = $9)
         AND ($10::text IS NULL OR s."playerId" = $10::int)
       GROUP BY d.country
       ORDER BY count DESC
      `,
      [gameId, safeStartDate, safeEndDate, eventTypeParam, eventNameParam, platformParam, deviceParam, countryParam, versionParam, playerIdParam]
    );

    res.json({
      totalEvents,
      totalEventsPrev,
      typeDistribution: typeDistResult.rows,
      trend: trendResult.rows,
      topEvents: topEventsResult.rows,
      platformBreakdown: platformResult.rows,
      countryBreakdown: countryResult.rows
    });
  } catch (error) {
    console.error('Events metrics error:', error);
    res.status(500).json({ error: 'Events metrics error: ' + (error instanceof Error ? error.message : String(error)) });
  }
});

// Events filters endpoint
router.get('/events/filters/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    // Unique event types
    const eventTypeResult = await pool.query('SELECT DISTINCT "eventType" FROM events');
    // Unique event names
    const eventNameResult = await pool.query('SELECT DISTINCT "eventName" FROM events');
    // Unique platforms
    const platformResult = await pool.query('SELECT DISTINCT platform FROM devices WHERE "gameId" = $1', [gameId]);
    // Unique devices
    const deviceResult = await pool.query('SELECT DISTINCT "deviceModel" FROM devices WHERE "gameId" = $1', [gameId]);
    // Unique countries
    const countryResult = await pool.query('SELECT DISTINCT country FROM devices WHERE "gameId" = $1', [gameId]);
    // Unique versions
    const versionResult = await pool.query('SELECT DISTINCT "gameVersion" FROM sessions WHERE "gameId" = $1 AND "gameVersion" IS NOT NULL', [gameId]);
    // Unique playerIds
    const playerIdResult = await pool.query('SELECT DISTINCT "playerId" FROM sessions WHERE "gameId" = $1', [gameId]);
    res.json({
      eventTypes: eventTypeResult.rows.map(r => r.eventType).filter(Boolean),
      eventNames: eventNameResult.rows.map(r => r.eventName).filter(Boolean),
      platforms: platformResult.rows.map(r => r.platform).filter(Boolean),
      devices: deviceResult.rows.map(r => r.deviceModel).filter(Boolean),
      countries: countryResult.rows.map(r => r.country).filter(Boolean),
      versions: versionResult.rows.map(r => r.gameVersion).filter(Boolean),
      playerIds: playerIdResult.rows.map(r => r.playerId).filter(Boolean)
    });
  } catch (error) {
    const err = error as Error;
    console.error('Events filters error:', err);
    res.status(500).json({ error: 'Events filters error: ' + err.message });
  }
});

export default router; 