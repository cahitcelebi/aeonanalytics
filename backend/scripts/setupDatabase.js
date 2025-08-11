const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        // SQL dosyasını oku
        const sqlPath = path.join(__dirname, '..', 'sql', 'create_tables.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf-8');

        // SQL komutlarını çalıştır
        await pool.query(sqlContent);
        console.log('Tablolar başarıyla oluşturuldu');
    } catch (error) {
        console.error('Tablo oluşturma hatası:', error);
    } finally {
        await pool.end();
    }
}

setupDatabase(); 