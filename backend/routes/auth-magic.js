/**
 * Magic Link Authentication Routes
 * Handles passwordless login with account recovery options
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { sendEmail, templates } = require('../config/email');
const { loginLimiter, registerLimiter, emailRequestLimiter } = require('../middleware/rateLimits');

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';
const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes
const BACKUP_CODE_COUNT = 10;
const MAX_RECOVERY_ATTEMPTS = 3;
const LOCKOUT_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a secure random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count = BACKUP_CODE_COUNT) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}-${part3}`);
  }
  return codes;
}

/**
 * Hash a value (for tokens, codes, answers)
 */
async function hashValue(value) {
  return bcrypt.hash(value.toLowerCase().trim(), 10);
}

/**
 * Verify a hashed value
 */
async function verifyHash(value, hash) {
  return bcrypt.compare(value.toLowerCase().trim(), hash);
}

/**
 * POST /api/auth-magic/register
 * Register a new user with magic link authentication
 */
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      preferredLanguage,
      backupEmail,
      securityQuestions
    } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, first name, and last name are required' });
    }

    if (!securityQuestions || securityQuestions.length !== 3) {
      return res.status(400).json({ error: 'Exactly 3 security questions are required' });
    }

    const existingUser = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userResult = await db.query(
      `INSERT INTO users (email, first_name, last_name, role, preferred_language, backup_email, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING user_id, email, first_name, last_name, role`,
      [
        email.toLowerCase(),
        firstName,
        lastName,
        role || 'reader',
        preferredLanguage || 'en',
        backupEmail ? backupEmail.toLowerCase() : null,
        'MAGIC_LINK_AUTH'
      ]
    );

    const user = userResult.rows[0];

    const backupCodes = generateBackupCodes();
    for (const code of backupCodes) {
      const codeHash = await hashValue(code);
      await db.query(
        'INSERT INTO backup_codes (user_id, code_hash) VALUES ($1, $2)',
        [user.user_id, codeHash]
      );
    }

    for (let i = 0; i < securityQuestions.length; i++) {
      const { question, answer } = securityQuestions[i];
      const answerHash = await hashValue(answer);
      await db.query(
        'INSERT INTO security_questions (user_id, question_text, answer_hash, question_order) VALUES ($1, $2, $3, $4)',
        [user.user_id, question, answerHash, i + 1]
      );
    }

    const token = generateToken();
    const tokenHash = await hashValue(token);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

    await db.query(
      'INSERT INTO magic_links (user_id, token_hash, expires_at, link_type) VALUES ($1, $2, $3, $4)',
      [user.user_id, tokenHash, expiresAt, 'verify_email']
    );

    const verifyLink = `${FRONTEND_URL}/pages/verify-email.html?token=${token}&email=${encodeURIComponent(email)}`;
    
    await sendEmail(
      email,
      'Welcome to AuctLect! Please verify your email',
      `Welcome to AuctLect!\n\nClick here to verify your email:\n${verifyLink}\n\nThis link expires in 15 minutes.`,
      `<h1>Welcome to AuctLect!</h1>
       <p>Click the button below to verify your email:</p>
       <a href="${verifyLink}" style="background: #8B7355; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a>
       <p>This link expires in 15 minutes.</p>`
    );

    res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify.',
      backupCodes: backupCodes,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth-magic/login
 * Request a magic link for login
 */
router.post('/login', emailRequestLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userResult = await db.query(
      'SELECT user_id, email, first_name, email_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        message: 'If this email is registered, a login link will be sent.' 
      });
    }

    const user = userResult.rows[0];

    const token = generateToken();
    const tokenHash = await hashValue(token);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

    await db.query(
      'UPDATE magic_links SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE',
      [user.user_id]
    );

    await db.query(
      'INSERT INTO magic_links (user_id, token_hash, expires_at, link_type) VALUES ($1, $2, $3, $4)',
      [user.user_id, tokenHash, expiresAt, 'login']
    );

    const loginLink = `${FRONTEND_URL}/pages/magic-login.html?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      'Your AuctLect Login Link',
      `Click here to log in:\n${loginLink}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
      `<h2>Log in to AuctLect</h2>
       <p>Click the button below to log in:</p>
       <a href="${loginLink}" style="background: #8B7355; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Log In to AuctLect</a>
       <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
       <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>`
    );

    res.json({
      success: true,
      message: 'If this email is registered, a login link will be sent.'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth-magic/verify
 * Verify a magic link token and log in
 */
router.post('/verify', loginLimiter, async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ error: 'Token and email are required' });
    }

    const userResult = await db.query(
      'SELECT user_id, email, first_name, last_name, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    const user = userResult.rows[0];

    const linkResult = await db.query(
      `SELECT link_id, token_hash, link_type FROM magic_links 
       WHERE user_id = $1 AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [user.user_id]
    );

    if (linkResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    const link = linkResult.rows[0];

    const isValid = await verifyHash(token, link.token_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    await db.query(
      'UPDATE magic_links SET is_used = TRUE, used_at = NOW() WHERE link_id = $1',
      [link.link_id]
    );

    if (link.link_type === 'verify_email') {
      await db.query(
        'UPDATE users SET email_verified = TRUE WHERE user_id = $1',
        [user.user_id]
      );
    }

    const jwtToken = jwt.sign(
      { userId: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token: jwtToken,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth-magic/recover/backup-code
 * Recover account using backup code
 */
router.post('/recover/backup-code', async (req, res) => {
  try {
    const { email, backupCode } = req.body;

    if (!email || !backupCode) {
      return res.status(400).json({ error: 'Email and backup code are required' });
    }

    const userResult = await db.query(
      'SELECT user_id, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or backup code' });
    }

    const user = userResult.rows[0];

    const codesResult = await db.query(
      'SELECT code_id, code_hash FROM backup_codes WHERE user_id = $1 AND is_used = FALSE',
      [user.user_id]
    );

    let validCode = null;
    for (const code of codesResult.rows) {
      const isValid = await verifyHash(backupCode.toUpperCase(), code.code_hash);
      if (isValid) {
        validCode = code;
        break;
      }
    }

    if (!validCode) {
      await db.query(
        'INSERT INTO recovery_attempts (user_id, attempt_type, success) VALUES ($1, $2, $3)',
        [user.user_id, 'backup_code', false]
      );
      return res.status(400).json({ error: 'Invalid email or backup code' });
    }

    await db.query(
      'UPDATE backup_codes SET is_used = TRUE, used_at = NOW() WHERE code_id = $1',
      [validCode.code_id]
    );

    await db.query(
      'INSERT INTO recovery_attempts (user_id, attempt_type, success) VALUES ($1, $2, $3)',
      [user.user_id, 'backup_code', true]
    );

    const remainingResult = await db.query(
      'SELECT COUNT(*) as count FROM backup_codes WHERE user_id = $1 AND is_used = FALSE',
      [user.user_id]
    );
    const remainingCodes = parseInt(remainingResult.rows[0].count);

    const jwtToken = jwt.sign(
      { userId: user.user_id, email: user.email, recovery: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: 'Backup code verified',
      token: jwtToken,
      remainingCodes: remainingCodes,
      warning: remainingCodes < 3 ? 'You have few backup codes left. Please generate new ones.' : null
    });

  } catch (error) {
    console.error('Backup code recovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth-magic/recover/backup-email
 * Send recovery link to backup email
 */
router.post('/recover/backup-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userResult = await db.query(
      'SELECT user_id, email, backup_email, first_name FROM users WHERE email = $1 AND backup_email IS NOT NULL',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        message: 'If a backup email is registered, a recovery link will be sent.' 
      });
    }

    const user = userResult.rows[0];

    const token = generateToken();
    const tokenHash = await hashValue(token);
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

    await db.query(
      'INSERT INTO magic_links (user_id, token_hash, expires_at, link_type) VALUES ($1, $2, $3, $4)',
      [user.user_id, tokenHash, expiresAt, 'recovery']
    );

    const recoveryLink = `${FRONTEND_URL}/pages/recover-account.html?token=${token}&email=${encodeURIComponent(user.email)}`;

    await sendEmail(
      user.backup_email,
      'AuctLect Account Recovery',
      `Hi ${user.first_name},\n\nSomeone requested account recovery for your AuctLect account.\n\nClick here to recover your account:\n${recoveryLink}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, please ignore this email.`,
      `<h2>Account Recovery</h2>
       <p>Hi ${user.first_name},</p>
       <p>Someone requested account recovery for your AuctLect account.</p>
       <a href="${recoveryLink}" style="background: #8B7355; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Recover Account</a>
       <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
       <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>`
    );

    await db.query(
      'INSERT INTO recovery_attempts (user_id, attempt_type, success) VALUES ($1, $2, $3)',
      [user.user_id, 'backup_email', true]
    );

    res.json({
      success: true,
      message: 'If a backup email is registered, a recovery link will be sent.'
    });

  } catch (error) {
    console.error('Backup email recovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth-magic/recover/questions/:email
 * Get security questions for account recovery
 */
router.get('/recover/questions/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const attemptsResult = await db.query(
      `SELECT COUNT(*) as count FROM recovery_attempts 
       WHERE user_id = (SELECT user_id FROM users WHERE email = $1)
       AND attempt_type = 'security_questions'
       AND success = FALSE
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [email.toLowerCase()]
    );

    if (parseInt(attemptsResult.rows[0].count) >= MAX_RECOVERY_ATTEMPTS) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please try again in 24 hours.' 
      });
    }

    const userResult = await db.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const questionsResult = await db.query(
      'SELECT question_id, question_text, question_order FROM security_questions WHERE user_id = $1 ORDER BY question_order',
      [userResult.rows[0].user_id]
    );

    res.json({
      success: true,
      questions: questionsResult.rows.map(q => ({
        id: q.question_id,
        question: q.question_text,
        order: q.question_order
      }))
    });

  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth-magic/recover/questions
 * Verify security question answers and allow email change
 */
router.post('/recover/questions', async (req, res) => {
  try {
    const { email, answers, newEmail } = req.body;

    if (!email || !answers || answers.length !== 3) {
      return res.status(400).json({ error: 'Email and 3 answers are required' });
    }

    const userResult = await db.query(
      'SELECT user_id, first_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const user = userResult.rows[0];

    const attemptsResult = await db.query(
      `SELECT COUNT(*) as count FROM recovery_attempts 
       WHERE user_id = $1 AND attempt_type = 'security_questions'
       AND success = FALSE AND created_at > NOW() - INTERVAL '24 hours'`,
      [user.user_id]
    );

    if (parseInt(attemptsResult.rows[0].count) >= MAX_RECOVERY_ATTEMPTS) {
      return res.status(429).json({ 
        error: 'Too many failed attempts. Please try again in 24 hours.' 
      });
    }

    const questionsResult = await db.query(
      'SELECT question_id, answer_hash, question_order FROM security_questions WHERE user_id = $1 ORDER BY question_order',
      [user.user_id]
    );

    let allCorrect = true;
    for (let i = 0; i < questionsResult.rows.length; i++) {
      const storedQuestion = questionsResult.rows[i];
      const providedAnswer = answers.find(a => a.questionId === storedQuestion.question_id);
      
      if (!providedAnswer) {
        allCorrect = false;
        break;
      }

      const isValid = await verifyHash(providedAnswer.answer, storedQuestion.answer_hash);
      if (!isValid) {
        allCorrect = false;
        break;
      }
    }

    await db.query(
      'INSERT INTO recovery_attempts (user_id, attempt_type, success) VALUES ($1, $2, $3)',
      [user.user_id, 'security_questions', allCorrect]
    );

    if (!allCorrect) {
      const remainingAttempts = MAX_RECOVERY_ATTEMPTS - parseInt(attemptsResult.rows[0].count) - 1;
      return res.status(400).json({ 
        error: 'One or more answers are incorrect',
        remainingAttempts: remainingAttempts
      });
    }

    if (newEmail) {
      await db.query(
        'UPDATE users SET email = $1, email_verified = FALSE WHERE user_id = $2',
        [newEmail.toLowerCase(), user.user_id]
      );

      const token = generateToken();
      const tokenHash = await hashValue(token);
      const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY);

      await db.query(
        'INSERT INTO magic_links (user_id, token_hash, expires_at, link_type) VALUES ($1, $2, $3, $4)',
        [user.user_id, tokenHash, expiresAt, 'verify_email']
      );

      const verifyLink = `${FRONTEND_URL}/pages/verify-email.html?token=${token}&email=${encodeURIComponent(newEmail)}`;

      await sendEmail(
        newEmail,
        'Verify your new email - AuctLect',
        `Your email has been changed. Click here to verify:\n${verifyLink}`,
        `<h2>Verify Your New Email</h2>
         <p>Your email has been changed. Click below to verify:</p>
         <a href="${verifyLink}" style="background: #8B7355; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email</a>`
      );

      return res.json({
        success: true,
        message: 'Email updated. Please check your new email to verify.'
      });
    }

    const jwtToken = jwt.sign(
      { userId: user.user_id, recovery: true },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: 'Security questions verified',
      token: jwtToken
    });

  } catch (error) {
    console.error('Security questions verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth-magic/backup-codes/regenerate
 * Generate new backup codes (requires authentication)
 */
router.post('/backup-codes/regenerate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await db.query('DELETE FROM backup_codes WHERE user_id = $1', [decoded.userId]);

    const backupCodes = generateBackupCodes();
    for (const code of backupCodes) {
      const codeHash = await hashValue(code);
      await db.query(
        'INSERT INTO backup_codes (user_id, code_hash) VALUES ($1, $2)',
        [decoded.userId, codeHash]
      );
    }

    res.json({
      success: true,
      message: 'New backup codes generated',
      backupCodes: backupCodes
    });

  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/auth-magic/backup-codes/count
 * Get remaining backup code count (requires authentication)
 */
router.get('/backup-codes/count', async (req, res) => {
  try {
    // Try session auth first
    let userId = null;
    
    if (req.session && req.session.userId) {
      userId = req.session.userId;
    } else {
      // Try JWT auth
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(
      'SELECT COUNT(*) as count FROM backup_codes WHERE user_id = $1 AND is_used = FALSE',
      [userId]
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error('Get backup code count error:', error);
    // Return 0 if table doesn't exist
    res.json({ success: true, count: 0 });
  }
});

module.exports = router;
