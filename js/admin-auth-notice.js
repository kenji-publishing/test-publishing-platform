/**
 * 管理画面で「数字が出ない理由」を画面に出す。
 *
 * 管理ページの読み込み処理は `if (response.ok) { ...表示... }` という書き方で、
 * else が無い。つまり401（期限切れ）や403（権限なし）が返ると**何も起きず、
 * 初期表示の "--" が残るだけ**になる。壊れているのか、データが無いのか、
 * 権限が無いのか、画面からは区別がつかなかった（2026-09-11にkenjiさんが遭遇）。
 *
 * 各ページのfetchの書き方はバラバラなので、call siteを書き換えるのではなく
 * window.fetch を包んで一箇所で捕まえる。読み込み側の修正は不要。
 *
 * 使い方: 管理ページの <head> か </body> 前で、他のスクリプトより先に読む。
 */
(function () {
    'use strict';

    var shown = false;

    /** JWTの中身を読む。**検証はしない**（表示に使うだけ。信頼の判断はサーバー側） */
    function readToken() {
        var t = localStorage.getItem('token');
        if (!t) return null;
        try {
            var p = t.split('.')[1];
            if (!p) return null;
            p = p.replace(/-/g, '+').replace(/_/g, '/');
            while (p.length % 4) p += '=';
            return JSON.parse(decodeURIComponent(escape(atob(p))));
        } catch (e) { return null; }
    }

    function whoami() {
        var c = readToken();
        if (!c) return 'ログインしていません';
        var who = c.email || '(不明)';
        var role = c.role ? '（' + c.role + '）' : '';
        return who + role;
    }

    function isExpired() {
        var c = readToken();
        if (!c || !c.exp) return false;
        return c.exp * 1000 < Date.now();
    }

    function expiredOn() {
        var c = readToken();
        if (!c || !c.exp) return '';
        var d = new Date(c.exp * 1000);
        return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }

    /** 画面の一番上に説明を出す。二重に出さない */
    function show(title, detail, withLogin) {
        if (shown) return;
        shown = true;

        var loginHref = location.pathname.indexOf('/pages/admin/') !== -1
            ? '../login.html' : 'pages/login.html';

        var box = document.createElement('div');
        box.setAttribute('role', 'alert');
        box.style.cssText = [
            'position:sticky', 'top:0', 'z-index:2000',
            'margin:0', 'padding:14px 18px',
            'background:#fff4e5', 'border-bottom:3px solid #e8a33d',
            'color:#5c3d00', 'font-size:14px', 'line-height:1.7',
            'font-family:system-ui,-apple-system,"Segoe UI",sans-serif'
        ].join(';');

        var html = '<strong style="font-size:15px">' + title + '</strong>'
            + '<div style="margin-top:4px">' + detail + '</div>'
            + '<div style="margin-top:6px;opacity:.8">現在のログイン: <code>' + whoami() + '</code></div>';
        if (withLogin) {
            html += '<div style="margin-top:10px">'
                + '<a href="' + loginHref + '" style="display:inline-block;padding:7px 16px;'
                + 'background:#8B7355;color:#fff;border-radius:6px;text-decoration:none">'
                + 'ログインし直す</a></div>';
        }
        box.innerHTML = html;

        if (document.body) document.body.insertBefore(box, document.body.firstChild);
        else document.addEventListener('DOMContentLoaded', function () {
            document.body.insertBefore(box, document.body.firstChild);
        });
    }

    // --- 読み込み時点で期限切れなら、fetchを待たずに知らせる ---
    if (isExpired()) {
        show('ログインの有効期限が切れています',
             '有効期限は ' + expiredOn() + ' でした。ログインは7日で切れます。'
             + 'このためデータを読み込めず、数字が「--」のままになっています。', true);
    }

    // --- 以降、APIが401/403/5xxを返したら知らせる ---
    var orig = window.fetch;
    if (typeof orig !== 'function') return;

    window.fetch = function (input, init) {
        return orig.apply(this, arguments).then(function (res) {
            try {
                var url = typeof input === 'string' ? input : (input && input.url) || '';
                if (url.indexOf('/api/') === -1) return res;

                if (res.status === 401) {
                    show('ログインの有効期限が切れています',
                         'ログインし直すと数字が表示されます。ログインは7日で切れます。', true);
                } else if (res.status === 403) {
                    show('このアカウントには管理者権限がありません',
                         '管理画面のデータは管理者(admin)のアカウントでしか読めません。'
                         + '別のアカウントでログインし直してください。', true);
                } else if (res.status >= 500) {
                    show('サーバーでエラーが発生しました（' + res.status + '）',
                         'データを読み込めませんでした。しばらく待っても直らない場合は記録を確認してください。', false);
                }
            } catch (e) { /* 通知の失敗で本来の処理を止めない */ }
            return res;
        });
    };
})();
