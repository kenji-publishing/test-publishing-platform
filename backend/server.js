/**
 * AuctLect Platform - Main Server
 * 
 * This is the entry point for the backend API server.
 * It sets up Express, connects to PostgreSQL, and defines all routes.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Fail fast if the JWT secret is missing. Without this, signing/verifying
// would either crash per-request or (with a hardcoded fallback) let anyone
// forge admin tokens. Refusing to start is the only safe behavior.
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set. Add it to backend/.env before starting the server.');
  process.exit(1);
}

// Import database connection
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workRoutes = require('./routes/works');
const translationRoutes = require('./routes/translations');
const paymentRoutes = require('./routes/payments');
const aiTranslationRoutes = require('./routes/ai-translation');
const aiEditorRoutes = require('./routes/ai-editor');
const aiToolsRoutes = require('./routes/ai-tools');
const agreementRoutes = require('./routes/agreements');
const notificationRoutes = require('./routes/notifications');
const authMagicRoutes = require('./routes/auth-magic');
const moderationRoutes = require('./routes/moderation');
const revenueRoutes = require('./routes/revenue');
const messagesRoutes = require('./routes/messages');
const interactionsRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');
const verificationRoutes = require('./routes/verification');
const financeRoutes = require('./routes/finance');
const payoutRoutes = require('./routes/payouts');
const inquiryRoutes = require('./routes/inquiries');
const reportRoutes = require('./routes/reports');
const dmcaRoutes = require('./routes/dmca');
const translationQueueRoutes = require('./routes/translation-queue');
const translatorMarketplaceRoutes = require('./routes/translator-marketplace');
const editorDirectoryRoutes = require('./routes/editors');
const readerFeedbackRoutes = require('./routes/reader-feedback');
const supportRoutes = require('./routes/support');
const analyticsRoutes = require('./routes/analytics');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Make db pool available to routes
app.set('db', db.pool);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8000',
  credentials: true
}));

// Stripe webhook needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// SESの不達通知（SNS）。署名の検証に生の本文が要るので、JSONパーサより前に登録する。
// SNSは Content-Type: text/plain で送ってくることがあり、express.json では読めない
const sesWebhookRoutes = require('./routes/ses-webhook');
app.use('/api/ses', sesWebhookRoutes);

// Long manuscripts exceed the 100kb default; nginx caps requests at 15M
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/works', workRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai-translation', aiTranslationRoutes);
app.use('/api/ai-editor', aiEditorRoutes);
app.use('/api/ai-tools', aiToolsRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth-magic', authMagicRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dmca', dmcaRoutes);
app.use('/api/translation-queue', translationQueueRoutes);
app.use('/api/translators', translatorMarketplaceRoutes);
app.use('/api/editors', editorDirectoryRoutes);
app.use('/api/feedback', readerFeedbackRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AuctLect API is running',
    timestamp: new Date().toISOString(),
    database: db.pool ? 'connected' : 'disconnected',
    // EU圏の購入をこのヘッダーで止めているので、届かなくなったら気づけるようにする。
    // 国名そのものは出さない（訪問者の所在地を返す必要はない）
    geo: req.headers['cf-ipcountry'] ? 'available' : 'unavailable'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to AuctLect API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      works: '/api/works',
      translations: '/api/translations',
      admin: '/api/admin',
      verification: '/api/verification',
      moderation: '/api/moderation',
      finance: '/api/finance',
      dmca: '/api/dmca',
      translationQueue: '/api/translation-queue',
      translators: '/api/translators',
      feedback: '/api/feedback',
      support: '/api/support',
      analytics: '/api/analytics'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// VAT登録を有効にしたのに税率表が埋まっていない、という事故をここで止める。
// 決済のたびに気づくのでは遅い。起動しなければ必ず気づく。
const { assertRateTableComplete, VAT_REGISTERED, missingCountries } = require('./config/vatRates');
assertRateTableComplete();

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AuctLect API Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🧾 VAT: ${VAT_REGISTERED
    ? '登録済み（税率表 完備）'
    : `未登録のため課税なし（税率表は残り ${missingCountries().length} か国が未確認）`}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/users/profile`);
  console.log(`   - GET  /api/works`);
  console.log(`   - GET  /api/admin/stats`);
  console.log(`   - GET  /api/admin/users`);
  console.log(`   - GET  /api/verification/admin/requests`);
  console.log(`   - GET  /api/moderation/admin/works`);
  console.log(`   - GET  /api/finance/admin/stats`);
  console.log(`   - GET  /api/dmca/admin/stats`);
  console.log(`   - GET  /api/dmca/admin/reports`);
  console.log(`   - GET  /api/translation-queue/admin/stats`);
  console.log(`   - GET  /api/translation-queue/admin/requests`);
  console.log(`   - GET  /api/translators`);
  console.log(`   - GET  /api/translators/:profileId`);
  console.log(`   - POST /api/feedback`);
  console.log(`   - GET  /api/feedback/work/:workId`);
  console.log(`   - GET  /api/support/faq/categories`);
  console.log(`   - GET  /api/support/faq`);
  console.log(`   - POST /api/support/tickets`);
  console.log(`   - GET  /api/analytics/author/overview`);
  console.log(`   - GET  /api/analytics/admin/overview`);
  console.log(`\n✨ Press Ctrl+C to stop\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  db.pool.end(() => {
    console.log('✅ Database connection closed');
    process.exit(0);
  });
});

module.exports = app;
