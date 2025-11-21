/**
 * Database Setup Script
 * 
 * Creates all necessary tables for the Publisher platform
 * Run this once to initialize your database
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'publisher_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const setupDatabase = async () => {
  console.log('\n💾 Starting database setup...\n');
  
  try {
    // 1. Create ENUM types
    console.log('Creating ENUM types...');
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'deleted');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE role_type_enum AS ENUM ('author', 'translator', 'editor', 'reader', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE content_type_enum AS ENUM ('text', 'manga', 'art');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE work_status_enum AS ENUM ('draft', 'published', 'archived', 'suspended');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE translation_type_enum AS ENUM ('ai', 'human', 'hybrid');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE translation_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ ENUM types created\n');
    
    // 2. Create Users table
    console.log('Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        pen_name VARCHAR(100),
        country_code VARCHAR(2),
        profile_image_url TEXT,
        bio TEXT,
        verified BOOLEAN DEFAULT FALSE,
        account_status account_status_enum DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('✅ Users table created\n');
    
    // 3. Create User Roles table
    console.log('Creating user_roles table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        role_type role_type_enum NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, role_type)
      )
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)');
    console.log('✅ User roles table created\n');
    
    // 4. Create User Languages table
    console.log('Creating user_languages table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        language_code VARCHAR(5) NOT NULL,
        proficiency_level VARCHAR(20) NOT NULL,
        can_translate_from BOOLEAN DEFAULT FALSE,
        can_translate_to BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User languages table created\n');
    
    // 5. Create Works table
    console.log('Creating works table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS works (
        work_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        author_id UUID NOT NULL REFERENCES users(user_id),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        original_language VARCHAR(5) NOT NULL,
        content_type content_type_enum NOT NULL,
        genre VARCHAR(100),
        tags TEXT[],
        cover_image_url TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        is_free BOOLEAN DEFAULT FALSE,
        status work_status_enum DEFAULT 'draft',
        published_at TIMESTAMP,
        view_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        rating_average DECIMAL(3, 2) DEFAULT 0.00,
        rating_count INTEGER DEFAULT 0,
        isbn VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_works_author_id ON works(author_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_works_status ON works(status)');
    console.log('✅ Works table created\n');
    
    // 6. Create Work Files table
    console.log('Creating work_files table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_files (
        file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
        file_type VARCHAR(20) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        page_number INTEGER,
        is_original BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Work files table created\n');
    
    // 7. Create Translations table
    console.log('Creating translations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS translations (
        translation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
        translator_id UUID REFERENCES users(user_id),
        target_language VARCHAR(5) NOT NULL,
        translation_type translation_type_enum NOT NULL,
        status translation_status_enum DEFAULT 'pending',
        quality_score DECIMAL(3, 2),
        translated_content TEXT,
        notes TEXT,
        completed_at TIMESTAMP,
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(work_id, target_language)
      )
    `);
    
    await pool.query('CREATE INDEX IF NOT EXISTS idx_translations_work_id ON translations(work_id)');
    console.log('✅ Translations table created\n');
    
    // 8. Create Platform Settings table
    console.log('Creating platform_settings table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default settings
    await pool.query(`
      INSERT INTO platform_settings (setting_key, setting_value, description)
      VALUES 
        ('revenue_author_base', '40', 'Base author revenue percentage'),
        ('revenue_translator', '20', 'Translator revenue percentage'),
        ('revenue_editor', '10', 'Editor revenue percentage'),
        ('revenue_platform', '30', 'Platform revenue percentage'),
        ('supported_languages', 'en,es,de,fr,ja,zh', 'Comma-separated language codes'),
        ('min_payout_threshold', '50.00', 'Minimum balance for payout in USD')
      ON CONFLICT (setting_key) DO NOTHING
    `);
    
    console.log('✅ Platform settings table created\n');
    
    console.log('✨ Database setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Test the API: curl http://localhost:3000/api/health\n');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
};

setupDatabase();