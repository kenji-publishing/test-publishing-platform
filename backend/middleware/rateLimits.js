/**
 * 認証系エンドポイントのレート制限（Bot・総当たり対策）
 *
 * 構成: Cloudflare → Nginx → Express のため、req.ip はそのままでは
 * 手前のプロキシのIPになる。Cloudflareが必ず付ける CF-Connecting-IP を
 * 優先し、無ければ X-Forwarded-For の先頭、最後に req.ip を使う。
 */

const rateLimit = require('express-rate-limit');

function clientIp(req) {
    const cf = req.headers['cf-connecting-ip'];
    if (cf) return String(cf);
    const xff = req.headers['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || 'unknown';
}

function makeLimiter({ windowMs, max, message }) {
    return rateLimit({
        windowMs,
        max,
        keyGenerator: clientIp,
        standardHeaders: true,
        legacyHeaders: false,
        // keyGeneratorで自前解決するため、X-Forwarded-For関連の内蔵チェックは無効化
        validate: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                code: 'RATE_LIMITED'
            });
        }
    });
}

// ログイン試行: 15分に10回まで（総当たり対策。正規ユーザーの打ち間違いには十分な余裕）
const loginLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts. Please try again in 15 minutes. / ログイン試行が多すぎます。15分後にお試しください。'
});

// 新規登録: 1時間に5アカウントまで（偽アカウント量産対策）
const registerLimiter = makeLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many registrations from this address. Please try again later. / 登録リクエストが多すぎます。時間をおいてお試しください。'
});

// 確認メール再送・マジックリンク要求: 15分に5回まで（メール爆撃対策）
const emailRequestLimiter = makeLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many email requests. Please try again in 15 minutes. / メール送信リクエストが多すぎます。15分後にお試しください。'
});

module.exports = { loginLimiter, registerLimiter, emailRequestLimiter };
