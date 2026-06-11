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

// Import database connection
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const workRoutes = require('./routes/works');
const translationRoutes = require('./routes/translations');
const paymentRoutes = require('./routes/payments');
const aiTranslationRoutes = require('./routes/ai-translation');
const notificationRoutes = require('./routes/notifications');
const authMagicRoutes = require('./routes/auth-magic');
const moderationRoutes = require('./routes/moderation');
const revenueRoutes = require('./routes/revenue');
const messagesRoutes = require('./routes/messages');
const interactionsRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');
const verificationRoutes = require('./routes/verification');
const financeRoutes = require('./routes/finance');
const dmcaRoutes = require('./routes/dmca');
const translationQueueRoutes = require('./routes/translation-queue');
const translatorMarketplaceRoutes = require('./routes/translator-marketplace');
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/works', workRoutes);
app.use('/api/translations', translationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai-translation', aiTranslationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth-magic', authMagicRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/dmca', dmcaRoutes);
app.use('/api/translation-queue', translationQueueRoutes);
app.use('/api/translators', translatorMarketplaceRoutes);
app.use('/api/feedback', readerFeedbackRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AuctLect API is running',
    timestamp: new Date().toISOString(),
    database: db.pool ? 'connected' : 'disconnected'
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

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AuctLect API Server is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
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
