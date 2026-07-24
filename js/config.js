/**
 * AuctLect global configuration
 *
 * Single source of truth for where the backend API lives.
 * - Local development (file:// or localhost) -> http://localhost:3000
 * - Production -> '' (same origin, e.g. fetch('/api/...'))
 *
 * When the production API gets its own domain, change it HERE ONLY
 * (or set window.API_ORIGIN before this script loads to override).
 */
(function () {
    if (typeof window.API_ORIGIN === 'string') return; // explicit override wins

    var isLocal = location.protocol === 'file:' ||
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1';

    window.API_ORIGIN = isLocal ? 'http://localhost:3000' : '';

    // DEMO_MODE: pages may simulate backend behavior (fake payment, dummy
    // data) ONLY when this is true. It must never be enabled implicitly in
    // production — a failed fetch is an error, not an invitation to pretend
    // the operation succeeded.
    window.DEMO_MODE = location.protocol === 'file:' ||
        new URLSearchParams(location.search).has('demo');

    // Google Sign-In のクライアントID。
    // これは公開情報（ブラウザに配信される）であり、秘密ではない。
    // 対になるクライアントシークレットはこの方式では使わない（IDトークン検証方式）。
    window.GOOGLE_CLIENT_ID = '215577027503-59q469f71p9efgig1993hjeg4n0euqna.apps.googleusercontent.com';
})();
