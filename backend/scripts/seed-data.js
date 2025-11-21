/**
 * Seed Data Script
 * 
 * Adds sample data for testing
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'publisher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const seedData = async () => {
  console.log('\n🌱 Seeding database with sample data...\n');
  
  try {
    // Create sample users
    console.log('Creating sample users...');
    
    const password = await bcrypt.hash('password123', 10);
    
    // Author
    const authorResult = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, pen_name, country_code, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
      RETURNING user_id
    `, [
      'author@publisher.com',
      password,
      'John',
      'Author',
      'J.A. Writer',
      'US',
      'Award-winning author of 10+ bestselling novels'
    ]);
    
    if (authorResult.rows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [authorResult.rows[0].user_id, 'author']
      );
      console.log('✅ Sample author created: author@publisher.com / password123');
    }
    
    // Translator
    const translatorResult = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, country_code, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING user_id
    `, [
      'translator@publisher.com',
      password,
      'Maria',
      'Translator',
      'ES',
      'Professional translator with 15 years experience'
    ]);
    
    if (translatorResult.rows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [translatorResult.rows[0].user_id, 'translator']
      );
      console.log('✅ Sample translator created: translator@publisher.com / password123');
    }
    
    // Editor
    const editorResult = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, country_code, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
      RETURNING user_id
    `, [
      'editor@publisher.com',
      password,
      'Emma',
      'Editor',
      'GB',
      'Experienced editor specializing in fiction and non-fiction'
    ]);
    
    if (editorResult.rows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_type) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [editorResult.rows[0].user_id, 'editor']
      );
      console.log('✅ Sample editor created: editor@publisher.com / password123');
    }
    
    console.log('\n✨ Sample data seeding completed!\n');
    console.log('You can now login with:');
    console.log('- author@publisher.com');
    console.log('- translator@publisher.com');
    console.log('- editor@publisher.com');
    console.log('Password for all: password123\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  } finally {
    await pool.end();
  }
};

seedData();