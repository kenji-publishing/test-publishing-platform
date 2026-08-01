/**
 * Authentication Routes
 * 
 * Handles user registration, login, and token management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../config/email');
const { loginLimiter, registerLimiter, emailRequestLimiter } = require('../middleware/rateLimits');
const { OAuth2Client } = require('google-auth-library');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000';
const VERIFY_LINK_EXPIRY = 24 * 60 * 60 * 1000; // 確認リンクは24時間有効
const RESET_LINK_EXPIRY = 60 * 60 * 1000;       // パスワード再設定リンクは1時間有効

/**
 * メール確認リンクを発行して送信する（登録時・再送時に共用）。
 * トークンの検証は POST /api/auth-magic/verify（bcrypt比較・使い捨て）が担う。
 */
async function sendVerificationEmail(userId, email, firstName) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + VERIFY_LINK_EXPIRY);

  // 古い未使用リンクは無効化してから発行（/verifyは最新の未使用リンクを見るため）
  await db.query(
    `UPDATE magic_links SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE`,
    [userId]
  );
  await db.query(
    `INSERT INTO magic_links (user_id, token_hash, expires_at, link_type)
     VALUES ($1, $2, $3, 'verify_email')`,
    [userId, tokenHash, expiresAt]
  );

  const verifyLink = `${FRONTEND_URL}/pages/verify-email.html?token=${token}&email=${encodeURIComponent(email)}`;
  return sendEmail(
    email,
    'AuctLect メールアドレスの確認 / Verify your email',
    `${firstName} 様\n\nAuctLectへのご登録ありがとうございます。\n以下のリンクをクリックしてメールアドレスを確認してください（24時間有効）:\n${verifyLink}\n\n心当たりがない場合はこのメールを無視してください。\n\n---\nThank you for registering with AuctLect.\nClick the link below to verify your email (valid for 24 hours):\n${verifyLink}`,
    `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>📚 AuctLect メールアドレスの確認</h2>
      <p>${firstName} 様</p>
      <p>AuctLectへのご登録ありがとうございます。<br>下のボタンをクリックしてメールアドレスを確認してください（24時間有効）。</p>
      <p style="text-align:center; margin: 28px 0;">
        <a href="${verifyLink}" style="background: #8B7355; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">メールアドレスを確認する / Verify Email</a>
      </p>
      <p style="color:#666; font-size: 13px;">ボタンが押せない場合はこちらのURLを開いてください:<br><a href="${verifyLink}">${verifyLink}</a></p>
      <p style="color:#666; font-size: 13px;">心当たりがない場合はこのメールを無視してください。 / If you didn't create this account, please ignore this email.</p>
    </div>`
  );
}

/**
 * POST /api/auth/register
 * Register a new user（メール確認リンクを送信。確認まではログイン不可）
 */
router.post('/register',
  registerLimiter,
  // Validation
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('role').isIn(['author', 'translator', 'editor', 'reader']),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email, password, firstName, lastName, role, penName, country } = req.body;
      
      // Check if user already exists
      const existingUser = await db.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'An account with this email already exists'
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create user with role
      const result = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, pen_name, country_code, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING user_id, email, first_name, last_name, pen_name, role, created_at`,
        [email, passwordHash, firstName, lastName, penName || null, country || null, role || 'reader']
      );
      
      const user = result.rows[0];
      
      // Also create user_roles entry for backward compatibility
      try {
        await db.query(
          'INSERT INTO user_roles (user_id, role_type) VALUES ($1, $2)',
          [user.user_id, role || 'reader']
        );
      } catch (e) {
        // user_roles table might not exist, ignore
        console.log('user_roles insert skipped:', e.message);
      }
      
      // メール確認リンクを送信（確認が済むまでログイン不可）
      // 送信失敗でもアカウントは作成済み — ログイン画面の「確認メールを再送」から再送できる
      let emailResult = { success: false };
      try {
        emailResult = await sendVerificationEmail(user.user_id, user.email, user.first_name);
      } catch (e) {
        console.error('Verification email failed:', e.message);
      }

      res.status(201).json({
        message: 'Registration accepted. Please verify your email.',
        emailSent: !!emailResult.success,
        verificationRequired: true,
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          penName: user.pen_name,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login',
  loginLimiter,
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user - get role from both users.role and user_roles table
      const result = await db.query(
        `SELECT u.user_id, u.email, u.password_hash, u.first_name, u.last_name,
                u.pen_name, u.account_status, u.role, u.email_verified, ur.role_type
         FROM users u
         LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
         WHERE u.email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }
      
      const user = result.rows[0];
      
      // Check account status
      if (user.account_status !== 'active') {
        return res.status(403).json({
          error: 'Account inactive',
          message: 'Your account has been suspended or deleted'
        });
      }
      
      // Googleのみで登録したアカウントはパスワードを持たない（password_hash IS NULL）。
      // bcrypt.compare に null を渡すと例外になるため、その前に案内を返す
      if (!user.password_hash) {
        return res.status(403).json({
          error: 'Google account',
          code: 'USE_GOOGLE_SIGN_IN',
          message: 'This account was created with Google. Please use "Sign in with Google".'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // メール未確認のアカウントはログイン不可（パスワード確認の後に判定し、情報漏えいを防ぐ）
      if (!user.email_verified) {
        return res.status(403).json({
          error: 'Email not verified',
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address. Check your inbox for the verification link.'
        });
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [user.user_id]
      );
      
      // Determine role: prefer users.role, fallback to user_roles.role_type, default to 'reader'
      const userRole = user.role || user.role_type || 'reader';
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.user_id,
          email: user.email,
          role: userRole
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.user_id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          penName: user.pen_name,
          role: userRole
        },
        token
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/auth/google
 * Googleでログイン / 新規登録（Google Identity Services のIDトークン方式）
 *
 * フロントが受け取ったIDトークン(credential)をここで検証する。改ざんは
 * Googleの署名検証で弾かれ、audienceが自分のクライアントIDであることも
 * verifyIdToken が確認するため、他サイト向けトークンの使い回しもできない。
 * クライアントシークレットは使わない（リダイレクト方式ではないため）。
 *
 * 紐付けの方針:
 *   1. google_id 一致 → そのアカウントでログイン
 *   2. メール一致 → 既存アカウントにgoogle_idを紐付け（Googleが確認済みの
 *      メールに限る。乗っ取り防止のためemail_verifiedが必須）
 *   3. どちらも無ければ新規作成（パスワード無し・メール確認済み扱い）
 */
router.post('/google', loginLimiter, async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: 'Google Sign-In is not configured on this server' });
    }
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'credential is required' });
    }

    // ===== IDトークンの検証（署名・有効期限・audienceをまとめて確認） =====
    let payload;
    try {
      const ticket = await new OAuth2Client(clientId).verifyIdToken({
        idToken: credential,
        audience: clientId
      });
      payload = ticket.getPayload();
    } catch (e) {
      console.warn('Google token verification failed:', e.message);
      return res.status(401).json({ error: 'Invalid Google credential' });
    }

    // Google側で未確認のメールは信用しない（他人のメールで登録される恐れ）
    if (!payload || !payload.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Google account email is not verified' });
    }

    const googleId = payload.sub;
    const email = String(payload.email).toLowerCase();
    const firstName = payload.given_name || (payload.name || '').split(' ')[0] || 'User';
    const lastName = payload.family_name || '';

    // ===== 1. google_id で既存アカウントを探す =====
    let user = (await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.pen_name,
              u.account_status, u.role, ur.role_type
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       WHERE u.google_id = $1`,
      [googleId]
    )).rows[0];

    // ===== 2. 同じメールの既存アカウントに紐付け =====
    if (!user) {
      user = (await db.query(
        `UPDATE users SET google_id = $1,
                          email_verified = true,
                          updated_at = CURRENT_TIMESTAMP
         WHERE LOWER(email) = $2 AND google_id IS NULL
         RETURNING user_id, email, first_name, last_name, pen_name, account_status, role`,
        [googleId, email]
      )).rows[0];
      if (user) console.log(`Google account linked to existing user: ${user.user_id}`);
    }

    // ===== 3. 新規作成（パスワード無し・Googleが確認済みなのでメール確認も完了扱い） =====
    let isNew = false;
    if (!user) {
      user = (await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, google_id, email_verified, role)
         VALUES ($1, NULL, $2, $3, $4, true, 'reader')
         RETURNING user_id, email, first_name, last_name, pen_name, account_status, role`,
        [email, firstName, lastName, googleId]
      )).rows[0];
      isNew = true;
      try {
        await db.query('INSERT INTO user_roles (user_id, role_type) VALUES ($1, $2)', [user.user_id, 'reader']);
      } catch (e) {
        console.log('user_roles insert skipped:', e.message);
      }
      console.log(`New user created via Google Sign-In: ${user.user_id}`);
    }

    if (user.account_status && user.account_status !== 'active') {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account has been suspended or deleted'
      });
    }

    await db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);

    // 通常ログインと同じ形のJWT・レスポンス（フロントの保存処理を共用するため）
    const userRole = user.role || user.role_type || 'reader';
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      isNewAccount: isNew,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        penName: user.pen_name,
        role: userRole
      },
      token
    });
  } catch (error) {
    console.error('Google Sign-In error:', error);
    res.status(500).json({ error: 'Google Sign-In failed', message: error.message });
  }
});

/**
 * POST /api/auth/resend-verification
 * 確認メールの再送。登録の有無を漏らさないため、常に同じ応答を返す
 */
router.post('/resend-verification',
  emailRequestLimiter,
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const genericResponse = {
      success: true,
      message: 'If this email is registered and unverified, a verification link has been sent.'
    };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email } = req.body;
      const result = await db.query(
        `SELECT user_id, email, first_name, email_verified FROM users
         WHERE email = $1 AND account_status = 'active'`,
        [email]
      );
      const user = result.rows[0];
      if (user && !user.email_verified) {
        await sendVerificationEmail(user.user_id, user.email, user.first_name);
      }
      res.json(genericResponse);
    } catch (error) {
      console.error('Resend verification error:', error);
      res.json(genericResponse); // 内部エラーも外には漏らさない
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.pen_name,
              u.country_code, u.bio, u.profile_image_url, u.verified, u.role,
              array_agg(DISTINCT ur.role_type) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.is_active = true
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    // Determine role
    const userRole = user.role || (user.roles && user.roles[0]) || 'reader';
    
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        penName: user.pen_name,
        country: user.country_code,
        bio: user.bio,
        profileImage: user.profile_image_url,
        verified: user.verified,
        role: userRole,
        roles: user.roles.filter(r => r !== null)
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile (alias for /me)
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.pen_name,
              u.country_code, u.bio, u.profile_image_url, u.verified, u.role
       FROM users u
       WHERE u.user_id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        penName: user.pen_name,
        country: user.country_code,
        bio: user.bio,
        profileImage: user.profile_image_url,
        verified: user.verified,
        role: user.role || 'reader'
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, penName, bio, country } = req.body;

    const result = await db.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           pen_name = COALESCE($3, pen_name),
           bio = COALESCE($4, bio),
           country_code = COALESCE($5, country_code),
           updated_at = NOW()
       WHERE user_id = $6
       RETURNING user_id, email, first_name, last_name, pen_name, bio, country_code`,
      [firstName, lastName, penName, bio, country, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        penName: user.pen_name,
        bio: user.bio,
        country: user.country_code
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/forgot-password
 * パスワード再設定リンクの送信。
 *
 * 「メールでログイン」(auth-magic) とは別物にしている:
 *   - こちらは**パスワードを設定し直す**ための一時リンク（link_type='reset_password'）
 *   - リンクだけでログインはできない（/auth-magic/verify は reset_password を受け付けない）
 * 登録の有無を漏らさないため、応答は常に同じ
 */
router.post('/forgot-password',
  emailRequestLimiter,
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const genericResponse = {
      success: true,
      message: 'If this email is registered, a password reset link has been sent.'
    };
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { email } = req.body;
      const user = (await db.query(
        `SELECT user_id, email, first_name FROM users
         WHERE email = $1 AND account_status = 'active'`,
        [email]
      )).rows[0];

      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(token, 10);
        const expiresAt = new Date(Date.now() + RESET_LINK_EXPIRY);

        // 未使用の再設定リンクは1本だけにする（古いものは無効化）
        await db.query(
          `UPDATE magic_links SET is_used = TRUE
           WHERE user_id = $1 AND is_used = FALSE AND link_type = 'reset_password'`,
          [user.user_id]
        );
        await db.query(
          `INSERT INTO magic_links (user_id, token_hash, expires_at, link_type)
           VALUES ($1, $2, $3, 'reset_password')`,
          [user.user_id, tokenHash, expiresAt]
        );

        const link = `${FRONTEND_URL}/pages/reset-password.html?token=${token}&email=${encodeURIComponent(user.email)}`;
        await sendEmail(
          user.email,
          'AuctLect パスワードの再設定 / Reset your password',
          `${user.first_name || ''} 様\n\n下のリンクからパスワードを再設定してください（1時間有効）:\n${link}\n\n心当たりがない場合はこのメールを無視してください。パスワードは変更されません。\n\n---\nReset your password using the link below (valid for 1 hour):\n${link}\n\nIf you did not request this, ignore this email — your password stays unchanged.`,
          `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#8B7355;">パスワードの再設定 / Reset your password</h2>
            <p>${user.first_name || ''} 様</p>
            <p>下のボタンからパスワードを再設定してください（1時間有効）。</p>
            <p style="text-align:center; margin:28px 0;">
              <a href="${link}" style="display:inline-block; padding:12px 28px; background:#8B7355; color:#fff; text-decoration:none; border-radius:6px;">パスワードを再設定 / Reset password</a>
            </p>
            <p style="color:#888; font-size:13px;">心当たりがない場合はこのメールを無視してください。パスワードは変更されません。<br>
            If you did not request this, ignore this email — your password stays unchanged.</p>
          </div>`
        );
      }
      res.json(genericResponse);
    } catch (error) {
      console.error('Forgot password error:', error);
      res.json(genericResponse); // 内部エラーも外には漏らさない
    }
  }
);

/**
 * POST /api/auth/reset-password
 * 再設定リンクのトークンを検証して新しいパスワードを設定する。
 * Googleのみで登録したアカウント（password_hash IS NULL）が
 * パスワードを設定する経路にもなる
 */
router.post('/reset-password', loginLimiter, async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Token, email and new password are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'PASSWORD_TOO_SHORT' });
    }

    const user = (await db.query(
      `SELECT user_id FROM users WHERE email = $1 AND account_status = 'active'`,
      [String(email).toLowerCase()]
    )).rows[0];
    // 存在しないアドレスでもリンク不正と同じ応答にする
    if (!user) return res.status(400).json({ error: 'Invalid or expired link', code: 'INVALID_LINK' });

    const link = (await db.query(
      `SELECT link_id, token_hash FROM magic_links
       WHERE user_id = $1 AND is_used = FALSE AND expires_at > NOW()
         AND link_type = 'reset_password'
       ORDER BY created_at DESC LIMIT 1`,
      [user.user_id]
    )).rows[0];
    if (!link) return res.status(400).json({ error: 'Invalid or expired link', code: 'INVALID_LINK' });

    const ok = await bcrypt.compare(token, link.token_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid or expired link', code: 'INVALID_LINK' });

    const hashed = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2`,
      [hashed, user.user_id]
    );
    await db.query(
      `UPDATE magic_links SET is_used = TRUE, used_at = NOW() WHERE link_id = $1`,
      [link.link_id]
    );

    console.log(`Password reset completed: user=${user.user_id}`);
    res.json({ success: true, message: 'Your password has been reset. Please sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * PUT /api/auth/password
 * Change current user password
 */
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Googleのみのアカウントは変更元パスワードが無い（別途「パスワードを設定」機能が必要）
    if (!userResult.rows[0].password_hash) {
      return res.status(400).json({
        error: 'Google account',
        code: 'USE_GOOGLE_SIGN_IN',
        message: 'This account signs in with Google and has no password to change.'
      });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
      [hashedPassword, req.user.userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
