const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function updatePasswords() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = ANY($2) RETURNING email',
      [hash, ['author@publisher.com', 'translator@publisher.com', 'editor@publisher.com']]
    );
    
    console.log('Updated passwords for:', result.rows.map(r => r.email));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

updatePasswords();
