/**
 * メールアドレスの打ち間違いに気づいてもらう。
 *
 * ■ なぜ要るか
 * 打ち間違えたまま登録されると、確認メールが不達になる。すると AWS SES が
 * そのアドレスを抑制リストに入れ、以後の送信を止める。本人は「メールが来ない」
 * としか分からず、ログインもパスワード再設定もできない。
 * 入口で1回聞くだけで、その大半を防げる。
 *
 * ■ 方針: 直さない。聞くだけ。
 * 勝手に書き換えると、正しいアドレスを壊す。「〜ではありませんか？」と示して、
 * 本人が押したときだけ入れ替える。無視して進むことも当然できる。
 *
 * 使い方:
 *   attachEmailTypoCheck(document.getElementById('email'));
 */
(function (global) {
  'use strict';

  // 実在する主要なドメイン。ここからの「近さ」で打ち間違いを疑う
  var KNOWN = [
    'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.jp', 'outlook.com',
    'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com', 'icloud.com',
    'me.com', 'aol.com', 'protonmail.com', 'proton.me', 'gmx.com', 'gmx.de',
    'web.de', 'mail.com', 'zoho.com', 'yandex.com', 'qq.com', '163.com',
    'naver.com', 'daum.net', 'hanmail.net', 'orange.fr', 'free.fr', 'wanadoo.fr',
    'libero.it', 'virgilio.it', 'terra.com.br', 'uol.com.br', 'bol.com.br',
    'btinternet.com', 'sky.com', 'nifty.com', 'docomo.ne.jp', 'ezweb.ne.jp',
    'softbank.ne.jp', 'au.com', 'ocn.ne.jp', 'biglobe.ne.jp', 'so-net.ne.jp'
  ];

  // 「近さ」では拾えない、よくある綴り違い
  var EXPLICIT = {
    'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmailc.om': 'gmail.com',
    'gnail.com': 'gmail.com', 'gmail.om': 'gmail.com', 'gmaill.com': 'gmail.com',
    'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
    'hotmail.co': 'hotmail.com', 'hotmil.com': 'hotmail.com',
    'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
    'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'outloo.com': 'outlook.com',
    'iclound.com': 'icloud.com', 'icloud.co': 'icloud.com', 'icoud.com': 'icloud.com',
    'live.con': 'live.com', 'aol.con': 'aol.com'
  };

  /** 2つの文字列の編集距離。1〜2文字違いを「打ち間違い」とみなすために使う */
  function distance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 99;   // 離れすぎ。計算するまでもない
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      for (j = 0; j <= b.length; j++) prev[j] = cur[j];
    }
    return prev[b.length];
  }

  /**
   * もしかして、を返す。疑わしくなければ null。
   * 既知のドメインと完全一致するものは、絶対に指摘しない。
   */
  function suggest(email) {
    if (!email || email.indexOf('@') < 0) return null;
    var at = email.lastIndexOf('@');
    var local = email.slice(0, at);
    var domain = email.slice(at + 1).toLowerCase().trim();
    if (!local || !domain) return null;

    // 正しいドメインを疑わない
    for (var k = 0; k < KNOWN.length; k++) if (KNOWN[k] === domain) return null;

    // 実在しない綴りは先に拾う（.con や .cm はTLDとして存在しない）
    if (EXPLICIT[domain]) return local + '@' + EXPLICIT[domain];

    // 国別のドメインを、打ち間違いと取り違えないための門。
    //   yahoo.ca / hotmail.fr / live.co.uk … いずれも実在する。
    //   これらは yahoo.com などと1〜2文字しか違わないので、距離だけで判定すると
    //   正しく入力した人に「間違っています」と言ってしまう。
    //   最初のドットまで（＝サービス名の部分）が既知のものと一致するなら、
    //   綴りは合っていて国が違うだけなので、指摘しない。
    var stem = domain.split('.')[0];
    for (var m = 0; m < KNOWN.length; m++) {
      if (KNOWN[m].split('.')[0] === stem) return null;
    }

    // 独自ドメイン（会社のアドレス等）を誤って指摘しないよう、近いものだけ拾う。
    // 短いドメインは1文字違いでも別物になりやすいので、距離1までに絞る
    var best = null, bestDist = 99;
    for (var i = 0; i < KNOWN.length; i++) {
      var d = distance(domain, KNOWN[i]);
      var limit = KNOWN[i].length <= 8 ? 1 : 2;
      if (d <= limit && d < bestDist) { bestDist = d; best = KNOWN[i]; }
    }
    return best ? local + '@' + best : null;
  }

  var TEXT = {
    en: function (s) { return 'Did you mean ' + s + ' ?'; },
    ja: function (s) { return 'もしかして ' + s + ' ではありませんか？'; },
    zh: function (s) { return '您是否想输入 ' + s + '？'; },
    es: function (s) { return '¿Quisiste decir ' + s + '?'; },
    fr: function (s) { return 'Vouliez-vous dire ' + s + ' ?'; },
    de: function (s) { return 'Meinten Sie ' + s + '?'; },
    ko: function (s) { return s + ' 을(를) 입력하려고 하셨나요?'; },
    ar: function (s) { return 'هل تقصد ' + s + '؟'; },
    pt: function (s) { return 'Você quis dizer ' + s + '?'; },
    it: function (s) { return 'Intendevi ' + s + '?'; }
  };
  var USE = {
    en: 'Use this', ja: 'これにする', zh: '使用这个', es: 'Usar este', fr: 'Utiliser',
    de: 'Übernehmen', ko: '이걸로', ar: 'استخدم هذا', pt: 'Usar este', it: 'Usa questo'
  };

  function lang() {
    try {
      if (global.i18n && global.i18n.getCurrentLanguage) return global.i18n.getCurrentLanguage();
    } catch (e) {}
    return localStorage.getItem('preferredLanguage') || 'en';
  }

  /**
   * 入力欄に「もしかして」を付ける。
   * 入力中は出さない（打っている途中は必ず不完全なので、うるさいだけ）。
   * 欄から離れたときに一度だけ見る。
   */
  function attachEmailTypoCheck(input) {
    if (!input || input.dataset.typoCheck) return;
    input.dataset.typoCheck = '1';

    var hint = document.createElement('div');
    hint.className = 'email-typo-hint';
    hint.style.cssText =
      'display:none;margin-top:.4rem;font-size:.85rem;line-height:1.6;' +
      'color:#6b5b45;background:#f7f4ef;border:1px solid #e0d8ca;' +
      'border-radius:8px;padding:.5rem .7rem;';
    input.parentNode.insertBefore(hint, input.nextSibling);

    function hide() { hint.style.display = 'none'; }

    input.addEventListener('blur', function () {
      var s = suggest(input.value.trim());
      if (!s) return hide();
      var l = lang();
      var msg = (TEXT[l] || TEXT.en)(s);
      hint.textContent = '';
      var span = document.createElement('span');
      span.textContent = msg + ' ';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = (USE[l] || USE.en);
      btn.style.cssText =
        'background:#8B7355;color:#fff;border:none;border-radius:6px;' +
        'padding:.15rem .6rem;font-size:.8rem;cursor:pointer;margin-inline-start:.3rem;';
      btn.addEventListener('click', function () {
        input.value = s;   // 押されたときだけ入れ替える。勝手には直さない
        hide();
        input.focus();
      });
      hint.appendChild(span);
      hint.appendChild(btn);
      hint.style.display = '';
    });

    // 直し始めたら引っ込める
    input.addEventListener('input', hide);
  }

  global.suggestEmailCorrection = suggest;
  global.attachEmailTypoCheck = attachEmailTypoCheck;
})(window);
