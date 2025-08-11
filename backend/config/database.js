const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: console.log // Geliştirme sırasında SQL sorgularını görmek için
});

// Bağlantıyı test et
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL bağlantısı başarılı.');
    } catch (error) {
        console.error('Bağlantı hatası:', error);
    }
}

testConnection();

module.exports = sequelize; 