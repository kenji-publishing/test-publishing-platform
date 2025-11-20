# Publisher Platform - Database Design

## Overview
This document outlines the complete database schema for the Publisher multilingual publishing platform.

---

## Core Tables

### 1. Users
Stores all user accounts (authors, translators, editors, readers)

```sql
CREATE TABLE users (
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
    account_status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. User Roles
Defines what roles each user can perform

```sql
CREATE TABLE user_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_type ENUM('author', 'translator', 'editor', 'reader', 'admin') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, role_type)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

### 3. User Languages
Language proficiency for translators and editors

```sql
CREATE TABLE user_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL, -- en, es, de, fr, ja, zh
    proficiency_level ENUM('native', 'professional', 'intermediate') NOT NULL,
    can_translate_from BOOLEAN DEFAULT FALSE,
    can_translate_to BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_languages_user_id ON user_languages(user_id);
CREATE INDEX idx_user_languages_language ON user_languages(language_code);
```

---

## Works & Content Tables

### 4. Works
Original works uploaded by authors

```sql
CREATE TABLE works (
    work_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES users(user_id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    original_language VARCHAR(5) NOT NULL,
    content_type ENUM('text', 'manga', 'art') NOT NULL,
    genre VARCHAR(100),
    tags TEXT[], -- Array of tags
    cover_image_url TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'published', 'archived', 'suspended') DEFAULT 'draft',
    published_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    isbn VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_works_author_id ON works(author_id);
CREATE INDEX idx_works_status ON works(status);
CREATE INDEX idx_works_genre ON works(genre);
CREATE INDEX idx_works_created_at ON works(created_at DESC);
```

### 5. Work Files
Actual content files (text, images, etc.)

```sql
CREATE TABLE work_files (
    file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    file_type ENUM('manuscript', 'image', 'cover', 'preview') NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    page_number INTEGER, -- for manga/comics
    is_original BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_files_work_id ON work_files(work_id);
CREATE INDEX idx_work_files_page_number ON work_files(work_id, page_number);
```

### 6. Translations
Translated versions of works

```sql
CREATE TABLE translations (
    translation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    translator_id UUID REFERENCES users(user_id),
    target_language VARCHAR(5) NOT NULL,
    translation_type ENUM('ai', 'human', 'hybrid') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected') DEFAULT 'pending',
    quality_score DECIMAL(3, 2),
    translated_content TEXT,
    notes TEXT,
    completed_at TIMESTAMP,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(work_id, target_language)
);

CREATE INDEX idx_translations_work_id ON translations(work_id);
CREATE INDEX idx_translations_translator_id ON translations(translator_id);
CREATE INDEX idx_translations_status ON translations(status);
```

### 7. Edits
Editing records for quality assurance

```sql
CREATE TABLE edits (
    edit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES works(work_id) ON DELETE CASCADE,
    translation_id UUID REFERENCES translations(translation_id) ON DELETE CASCADE,
    editor_id UUID NOT NULL REFERENCES users(user_id),
    edit_type ENUM('developmental', 'copy', 'line', 'proof') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'approved') DEFAULT 'pending',
    feedback TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_edits_work_id ON edits(work_id);
CREATE INDEX idx_edits_translation_id ON edits(translation_id);
CREATE INDEX idx_edits_editor_id ON edits(editor_id);
```

---

## Revenue & Payments Tables

### 8. Transactions
All platform transactions (purchases, subscriptions)

```sql
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    work_id UUID REFERENCES works(work_id),
    transaction_type ENUM('purchase', 'subscription', 'tip', 'refund') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50), -- stripe, paypal, etc.
    payment_gateway_id VARCHAR(255), -- Stripe payment ID
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_work_id ON transactions(work_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

### 9. Revenue Splits
Revenue distribution for each transaction

```sql
CREATE TABLE revenue_splits (
    split_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    work_id UUID NOT NULL REFERENCES works(work_id),
    recipient_id UUID NOT NULL REFERENCES users(user_id),
    role ENUM('author', 'translator', 'editor', 'platform') NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL, -- e.g., 40.00 for 40%
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'paid', 'failed') DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revenue_splits_transaction_id ON revenue_splits(transaction_id);
CREATE INDEX idx_revenue_splits_recipient_id ON revenue_splits(recipient_id);
CREATE INDEX idx_revenue_splits_work_id ON revenue_splits(work_id);
```

### 10. Payouts
Payouts to creators

```sql
CREATE TABLE payouts (
    payout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    stripe_payout_id VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    scheduled_date DATE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

---

## Analytics Tables

### 11. Views
Track work views and reading sessions

```sql
CREATE TABLE views (
    view_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id),
    language VARCHAR(5),
    ip_address INET,
    user_agent TEXT,
    session_duration INTEGER, -- seconds
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_views_work_id ON views(work_id);
CREATE INDEX idx_views_viewed_at ON views(viewed_at DESC);
```

### 12. Reviews & Ratings

```sql
CREATE TABLE reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    language VARCHAR(5),
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(work_id, user_id)
);

CREATE INDEX idx_reviews_work_id ON reviews(work_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
```

---

## Rights & Compliance Tables

### 13. Rights Management

```sql
CREATE TABLE work_rights (
    rights_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    rights_holder_id UUID NOT NULL REFERENCES users(user_id),
    license_type ENUM('exclusive', 'non-exclusive', 'creative_commons') NOT NULL,
    territory VARCHAR(100), -- e.g., 'worldwide', 'US only'
    language_rights TEXT[], -- array of language codes
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_rights_work_id ON work_rights(work_id);
```

### 14. Content Reports
User reports for violations

```sql
CREATE TABLE content_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID REFERENCES works(work_id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(user_id),
    report_type ENUM('copyright', 'inappropriate', 'spam', 'other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_content_reports_work_id ON content_reports(work_id);
CREATE INDEX idx_content_reports_status ON content_reports(status);
```

---

## Social Features Tables

### 15. Followers

```sql
CREATE TABLE followers (
    follower_id UUID NOT NULL REFERENCES users(user_id),
    following_id UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
```

### 16. Comments

```sql
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_id UUID NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    parent_comment_id UUID REFERENCES comments(comment_id),
    comment_text TEXT NOT NULL,
    language VARCHAR(5),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_work_id ON comments(work_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```

---

## System Tables

### 17. Platform Settings

```sql
CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial revenue split settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
('revenue_author_base', '40', 'Base author revenue percentage'),
('revenue_translator', '20', 'Translator revenue percentage'),
('revenue_editor', '10', 'Editor revenue percentage'),
('revenue_platform', '30', 'Platform revenue percentage'),
('supported_languages', 'en,es,de,fr,ja,zh', 'Comma-separated language codes'),
('min_payout_threshold', '50.00', 'Minimum balance for payout in USD');
```

---

## Key Relationships

1. **Users** can have multiple **Roles** (author, translator, editor)
2. **Authors** create **Works**
3. **Works** can have multiple **Translations** in different languages
4. **Translations** and **Works** can have multiple **Edits**
5. Each **Transaction** generates multiple **Revenue Splits** for different contributors
6. **Views** track engagement with **Works**
7. **Work Rights** define ownership and licensing for **Works**

---

## Revenue Split Logic

### Scenario 1: Author Only (Full Workflow)
- Author: 40%
- Translator: 20%
- Editor: 10%
- Platform: 30%

### Scenario 2: Author + Self Translation
- Author: 60% (40% + 20%)
- Editor: 10%
- Platform: 30%

### Scenario 3: Author + Self Translation + Self Editing
- Author: 70% (40% + 20% + 10%)
- Platform: 30%

---

## Indexes Summary

All critical foreign keys have indexes for optimal query performance:
- User lookups
- Work queries
- Transaction history
- Revenue tracking
- Analytics queries

---

## Future Enhancements

1. **Notification system** table for user alerts
2. **AI translation logs** for tracking AI usage
3. **Subscription tiers** for premium features
4. **Reading progress** table for bookmark functionality
5. **Collections/Series** table for grouping related works
6. **Promotional campaigns** table for marketing
7. **Author analytics dashboard** aggregated tables
8. **Multi-currency support** expansion

---

**Version:** 1.0  
**Last Updated:** 2024-11-20  
**Author:** Publisher Development Team
