// Oyun metriklerini getir
router.get('/:gameId/metrics', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { startDate, endDate, mode = 'test' } = req.query;

    // Test mode için analytics tablosundan veri çek
    if (mode === 'test') {
      const query = `
        SELECT 
          dau,
          wau,
          mau,
          avg_session_duration as avg_duration,
          retentionDay1 as day1_retention,
          retentionDay7 as day7_retention,
          retentionDay30 as day30_retention
        FROM analytics
        WHERE date BETWEEN $1 AND $2
        ORDER BY date DESC
        LIMIT 1
      `;

      const result = await pool.query(query, [startDate, endDate]);
      
      if (result.rows.length === 0) {
        return res.json({
          dau: 0,
          wau: 0,
          mau: 0,
          avgSessionDuration: 0,
          retention: {
            day1: 0,
            day7: 0,
            day30: 0
          }
        });
      }

      return res.json({
        dau: parseInt(result.rows[0].dau) || 0,
        wau: parseInt(result.rows[0].wau) || 0,
        mau: parseInt(result.rows[0].mau) || 0,
        avgSessionDuration: parseInt(result.rows[0].avg_duration) || 0,
        retention: {
          day1: parseFloat(result.rows[0].day1_retention) || 0,
          day7: parseFloat(result.rows[0].day7_retention) || 0,
          day30: parseFloat(result.rows[0].day30_retention) || 0
        }
      });
    }

    // Prod mode için gerçek verilerden hesapla
    const dauQuery = `
      SELECT COUNT(DISTINCT user_id) as dau
      FROM events
      WHERE game_id = $1
      AND timestamp >= $2
      AND timestamp <= $3
    `;

    const wauQuery = `
      SELECT COUNT(DISTINCT user_id) as wau
      FROM events
      WHERE game_id = $1
      AND timestamp >= $2 - INTERVAL '7 days'
      AND timestamp <= $3
    `;

    const mauQuery = `
      SELECT COUNT(DISTINCT user_id) as mau
      FROM events
      WHERE game_id = $1
      AND timestamp >= $2 - INTERVAL '30 days'
      AND timestamp <= $3
    `;

    const avgSessionQuery = `
      SELECT AVG(session_duration) as avg_duration
      FROM sessions
      WHERE game_id = $1
      AND start_time >= $2
      AND end_time <= $3
    `;

    const retentionQuery = `
      WITH user_first_events AS (
        SELECT 
          user_id,
          MIN(timestamp) as first_event
        FROM events
        WHERE game_id = $1
        GROUP BY user_id
      )
      SELECT
        AVG(CASE WHEN EXISTS (
          SELECT 1 FROM events e
          WHERE e.user_id = ufe.user_id
          AND e.game_id = $1
          AND e.timestamp >= ufe.first_event + INTERVAL '1 day'
          AND e.timestamp < ufe.first_event + INTERVAL '2 days'
        ) THEN 1 ELSE 0 END) * 100 as day1_retention,
        AVG(CASE WHEN EXISTS (
          SELECT 1 FROM events e
          WHERE e.user_id = ufe.user_id
          AND e.game_id = $1
          AND e.timestamp >= ufe.first_event + INTERVAL '7 days'
          AND e.timestamp < ufe.first_event + INTERVAL '8 days'
        ) THEN 1 ELSE 0 END) * 100 as day7_retention,
        AVG(CASE WHEN EXISTS (
          SELECT 1 FROM events e
          WHERE e.user_id = ufe.user_id
          AND e.game_id = $1
          AND e.timestamp >= ufe.first_event + INTERVAL '30 days'
          AND e.timestamp < ufe.first_event + INTERVAL '31 days'
        ) THEN 1 ELSE 0 END) * 100 as day30_retention
      FROM user_first_events ufe
      WHERE ufe.first_event >= $2 - INTERVAL '30 days'
      AND ufe.first_event <= $3
    `;

    const [dauResult, wauResult, mauResult, avgSessionResult, retentionResult] = await Promise.all([
      pool.query(dauQuery, [gameId, startDate, endDate]),
      pool.query(wauQuery, [gameId, startDate, endDate]),
      pool.query(mauQuery, [gameId, startDate, endDate]),
      pool.query(avgSessionQuery, [gameId, startDate, endDate]),
      pool.query(retentionQuery, [gameId, startDate, endDate])
    ]);

    res.json({
      dau: parseInt(dauResult.rows[0].dau) || 0,
      wau: parseInt(wauResult.rows[0].wau) || 0,
      mau: parseInt(mauResult.rows[0].mau) || 0,
      avgSessionDuration: parseInt(avgSessionResult.rows[0].avg_duration) || 0,
      retention: {
        day1: parseFloat(retentionResult.rows[0].day1_retention) || 0,
        day7: parseFloat(retentionResult.rows[0].day7_retention) || 0,
        day30: parseFloat(retentionResult.rows[0].day30_retention) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching game metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event analizlerini getir
router.get('/:gameId/events', authenticateToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { startDate, endDate, eventName } = req.query;

    let query = `
      SELECT 
        event_name,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM events
      WHERE game_id = $1
      AND timestamp >= $2
      AND timestamp <= $3
    `;

    const params = [gameId, startDate, endDate];

    if (eventName) {
      query += ' AND event_name = $4';
      params.push(eventName);
    }

    query += `
      GROUP BY event_name, DATE(timestamp)
      ORDER BY date, event_name
    `;

    const result = await pool.query(query, params);

    // Verileri frontend'in beklediği formata dönüştür
    const eventsByDate = {};
    result.rows.forEach(row => {
      if (!eventsByDate[row.date]) {
        eventsByDate[row.date] = {};
      }
      eventsByDate[row.date][row.event_name] = parseInt(row.count);
    });

    res.json(eventsByDate);
  } catch (error) {
    console.error('Error fetching event analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 