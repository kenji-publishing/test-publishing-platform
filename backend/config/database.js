/**
 * Database Configuration
 * 
 * Connects to PostgreSQL database using pg library
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'publisher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'publisher123',
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    console.error('\n📋 Please check:');
    console.error('   1. PostgreSQL is installed and running');
    console.error('   2. Database "publisher_db" exists');
    console.error('   3. Username and password are correct in .env file');
    console.error('\n💡 To create the database, run:');
    console.error('   createdb publisher_db');
    console.error('   or use pgAdmin to create it manually\n');
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Export pool for queries
module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
