const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const geoip = require('geoip-lite');

async function updateSchema() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // SQL dosyasını oku
        const sqlPath = path.join(__dirname, '..', 'sql', 'update_schema.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf-8');

        // SQL komutlarını çalıştır
        await pool.query(sqlContent);
        console.log('Veritabanı şeması başarıyla güncellendi');
    } catch (error) {
        console.error('Şema güncelleme hatası:', error);
    } finally {
        await pool.end();
    }
}

updateSchema(); 