const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

exports.validateApiKey = async (req, res, next) => {
  try {
    // Tüm request header'larını debug için logla
    console.log('Received request headers:', JSON.stringify(req.headers, null, 2));
    
    // API key'i header'dan al
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      console.log('API key not provided in headers');
      return res.status(401).json({ message: 'API key required' });
    }
    
    console.log('Validating API key:', apiKey.substring(0, 6) + '...');
    
    // Test API key için özel durum - Unity testlerinde kolaylık sağlayacak
    const TEST_KEY = "test-api-key-000";
    if (apiKey === TEST_KEY) {
      console.log('TEST_KEY kullanıldı: Özel test modu aktif');
      
      req.game = {
        game_id: 'test-game-000',
        name: 'Test Game',
        platform: 'Unity',
        api_key: TEST_KEY
      };
      
      if (!req.body) {
        req.body = {};
      }
      
      req.body.game_id = req.game.game_id;
      console.log(`TEST KEY kullanıldı: ${req.game.game_id}`);
      
      next();
      return;
    }
    
    // GELİŞTİRME MODU: API key doğrulama bypass
    const DEV_MODE = false; // Gerçek API key doğrulaması için false yapıldı
    
    if (DEV_MODE) {
      // Geliştirme modunda olduğumuzda, API key doğrulamasını atlayıp test veri oluşturuyoruz
      console.log('DEVELOPMENT MODE: Bypassing API key validation');
      
      req.game = {
        game_id: 'dev-game-001',
        name: 'Development Game',
        platform: 'Unity',
        api_key: apiKey || 'dev-api-key'
      };
      
      // İstek gövdesine game_id ekle
      if (!req.body) {
        req.body = {};
      }
      
      req.body.game_id = req.game.game_id;
      console.log(`DEV MODE: Using game_id: ${req.game.game_id}`);
      
      next();
      return;
    }
    
    // NORMAL MOD: Veritabanında API key'i kontrol et
    console.log('Querying database for API key:', apiKey.substring(0, 6) + '...');
    const result = await pool.query(
      'SELECT * FROM games WHERE api_key = $1',
      [apiKey]
    );
    
    console.log('Query result rows:', result.rows.length);
    
    if (result.rows.length === 0) {
      console.log('API key not found in database:', apiKey.substring(0, 6) + '...');
      return res.status(401).json({ message: 'Invalid API key' });
    }
    
    // Oyun bilgilerini req'e ekle
    req.game = result.rows[0];
    
    // İstek gövdesine game_id ekle (eğer req.body yoksa oluştur)
    if (!req.body) {
      req.body = {};
    }
    
    req.body.game_id = req.game.game_id;
    console.log(`API key validated for game: ${req.game.game_id} (${req.game.name})`);
    
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 