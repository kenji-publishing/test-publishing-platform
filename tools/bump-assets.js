#!/usr/bin/env node
/**
 * AuctLect - アセットのバージョン付け（キャッシュ対策）
 *
 * CSS/JS を更新しても、読者のブラウザが古いファイルを使い続けて
 * 表示が崩れる・機能が動かない、という事故を防ぐための道具。
 * HTML の中の  <link href="css/style-new.css">  を
 *              <link href="css/style-new.css?v=202608011230">
 * のように書き換える。ファイルの中身は一切変えない。
 *
 * 使い方:
 *   node tools/bump-assets.js            デプロイ前に実行。今の日時でバージョンを付け直す
 *   node tools/bump-assets.js 20260801   バージョンを自分で指定する
 *   node tools/bump-assets.js --check    付け忘れがないか確認するだけ（書き換えない）
 *
 * 仕組みの全体像:
 *   - HTML 自体はキャッシュしない設定（nginx: no-cache）。だから常に最新の ?v= が読まれる
 *   - ?v= が付いた CSS/JS/JSON は1年間キャッシュ（nginx: immutable）。2回目以降は瞬時に表示
 *   - バージョンを変えると URL が別物になるので、全員に確実に新しいファイルが届く
 *   - 翻訳JSON（js/lang/*.json）は HTML に書かれていないが、
 *     i18n.js が自分に付いた ?v= を読み取って JSON にも引き継ぐ（js/i18n.js の _assetVersion）
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git', '.claude', 'node_modules', 'backend', 'deploy', 'tools', 'uploads']);

// バージョンを付ける対象の拡張子
const VERSIONED_EXT = /\.(css|js|svg)$/i;

// ---------- 対象HTMLを集める ----------

function collectHtml(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// ---------- 判定 ----------

// 外部CDN・data URI・絶対URLには付けない（付けても意味がなく、壊す可能性がある）
function isLocalAsset(url) {
  if (!url) return false;
  if (/^(https?:)?\/\//i.test(url)) return false;
  if (/^(data|mailto|tel|javascript|blob):/i.test(url)) return false;
  if (url.startsWith('#')) return false;
  const withoutQuery = url.split('?')[0].split('#')[0];
  return VERSIONED_EXT.test(withoutQuery);
}

function setVersion(url, version) {
  const hash = url.indexOf('#') >= 0 ? url.slice(url.indexOf('#')) : '';
  let base = hash ? url.slice(0, url.indexOf('#')) : url;

  const q = base.indexOf('?');
  let params = '';
  if (q >= 0) {
    // 既存のクエリから v だけ抜いて、他のパラメータは残す
    params = base.slice(q + 1)
      .split('&')
      .filter(p => p && !/^v=/.test(p))
      .join('&');
    base = base.slice(0, q);
  }
  const query = params ? params + '&v=' + version : 'v=' + version;
  return base + '?' + query + hash;
}

// ---------- 書き換え ----------

/**
 * <link> と <script> の開始タグの中だけを見る。
 * こうしないと <script> ブロック内のJSの文字列（'js/lang/' など）まで
 * 書き換えてしまい、コードを壊す。
 */
const TAG_RE = /<(?:link|script)\b[^>]*>/gi;
const ATTR_RE = /\b(href|src)\s*=\s*"([^"]*)"/i;

function processHtml(text, version, stats) {
  return text.replace(TAG_RE, tag => {
    const m = tag.match(ATTR_RE);
    if (!m) return tag;
    const url = m[2];
    if (!isLocalAsset(url)) return tag;

    const updated = setVersion(url, version);
    stats.refs++;
    if (updated !== url) stats.changed++;
    return tag.replace(ATTR_RE, (_, attr) => attr + '="' + updated + '"');
  });
}

function findUnversioned(text) {
  const missing = [];
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(text)) !== null) {
    const attr = m[0].match(ATTR_RE);
    if (!attr) continue;
    const url = attr[2];
    if (!isLocalAsset(url)) continue;
    if (!/[?&]v=/.test(url)) missing.push(url);
  }
  return missing;
}

// ---------- 実行 ----------

function timestamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return String(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes());
}

function main() {
  const arg = process.argv[2];
  const checkOnly = arg === '--check';
  const version = (!arg || checkOnly) ? timestamp() : arg;

  if (!checkOnly && !/^[A-Za-z0-9._-]+$/.test(version)) {
    console.error('バージョン文字列に使えない文字が含まれています: ' + version);
    process.exit(1);
  }

  const files = collectHtml(ROOT, []);
  const stats = { refs: 0, changed: 0, files: 0 };

  if (checkOnly) {
    let bad = 0;
    for (const file of files) {
      const missing = findUnversioned(fs.readFileSync(file, 'utf8'));
      if (missing.length) {
        bad += missing.length;
        console.log('  ' + path.relative(ROOT, file).replace(/\\/g, '/'));
        for (const u of missing) console.log('      ' + u);
      }
    }
    if (bad) {
      console.log('\nバージョンが付いていない参照が ' + bad + ' 件あります。');
      console.log('`node tools/bump-assets.js` を実行してください。');
      process.exit(1);
    }
    console.log('OK: ' + files.length + ' ファイル、付け忘れはありません。');
    return;
  }

  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    const after = processHtml(before, version, stats);
    if (after !== before) {
      fs.writeFileSync(file, after);
      stats.files++;
    }
  }

  console.log('バージョン: ' + version);
  console.log('HTML ' + files.length + ' ファイルを確認、' + stats.files + ' ファイルを更新');
  console.log('アセット参照 ' + stats.refs + ' 件（うち書き換え ' + stats.changed + ' 件）');
}

main();
