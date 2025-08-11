const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Yeni oyun oluştur
exports.createGame = async (req, res) => {
  try {
    const { game_id, name, platform, description } = req.body;
    const developerId = req.user.id;
    
    // Game ID formatını kontrol et
    if (!game_id || !/^[a-zA-Z0-9_\-]{3,50}$/.test(game_id)) {
      return res.status(400).json({ 
        message: 'Invalid game_id format. Use only letters, numbers, underscore, and dash (3-50 characters).' 
      });
    }
    
    // Game ID'nin benzersiz olduğunu kontrol et
    const existingGame = await pool.query(
      'SELECT * FROM games WHERE game_id = $1',
      [game_id]
    );
    
    if (existingGame.rows.length > 0) {
      return res.status(400).json({ message: 'Game ID already exists. Please choose another one.' });
    }
    
    // API key oluştur
    const apiKey = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO games 
        (game_id, developer_id, name, platform, description, api_key) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [game_id, developerId, name, platform, description, apiKey]
    );

    res.status(201).json({
      message: 'Game created successfully',
      game: result.rows[0]
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Geliştirici oyunlarını listele
exports.getGames = async (req, res) => {
  try {
    const developerId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM games WHERE developer_id = $1',
      [developerId]
    );

    res.json({
      games: result.rows
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Oyun detaylarını al
exports.getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const developerId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM games WHERE game_id = $1 AND developer_id = $2',
      [gameId, developerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json({
      game: result.rows[0]
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// API key yenile
exports.regenerateApiKey = async (req, res) => {
  try {
    const { gameId } = req.params;
    const developerId = req.user.id;

    // Oyunun geliştiriciye ait olduğunu kontrol et
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE game_id = $1 AND developer_id = $2',
      [gameId, developerId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Yeni API key oluştur
    const newApiKey = crypto.randomBytes(32).toString('hex');

    // API key'i güncelle
    await pool.query(
      'UPDATE games SET api_key = $1, updated_at = NOW() WHERE game_id = $2',
      [newApiKey, gameId]
    );

    res.json({
      message: 'API key regenerated successfully',
      gameId,
      apiKey: newApiKey
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 