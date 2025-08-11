import { readFileSync } from 'fs';
import { join } from 'path';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/aeon_analytics');
async function setupDatabase() {
    try {
        // Read SQL file
        const createTablesSQL = readFileSync(join(__dirname, '../../sql/create_tables.sql'), 'utf8');
        // Drop all tables if they exist
        await sequelize.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
        // Create tables
        await sequelize.query(createTablesSQL);
        console.log('Tables created successfully');
        console.log('Database setup completed successfully');
    }
    catch (error) {
        console.error('Error setting up database:', error);
    }
    finally {
        await sequelize.close();
    }
}
setupDatabase();
