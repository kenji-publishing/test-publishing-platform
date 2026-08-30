/**
 * AuctLect Platform - Navbar JavaScript (Pattern C)
 *
 * Dynamically generates navbar and footer HTML.
 * Each page only needs:
 *   <div id="navbar-container"></div>  (where navbar goes)
 *   <div id="footer-container"></div>  (where footer goes)
 *   <script src="[PATH]js/navbar.js"></script>
 *
 * Global functions:
 *   getCurrentLanguage() - returns current language code
 *   getL(obj) - returns value for current language from multilingual object
 *   toggleUserDropdown(e) - toggle user dropdown open/close
 *   handleLogout() - logout with confirmation
 *   loadUserInfo() - load and display user info
 *   updateNavText() - update all navbar/footer multilingual text
 *   renderNavbar(options) - generate navbar HTML
 *   renderFooter(options) - generate footer HTML
 *   detectPathPrefix() - auto-detect path prefix from URL
 */

// ========== Multilingual text (Navbar, 9 languages) ==========
var navText = {
    browse: {
        en: 'Browse', ja: '作品を探す', zh: '浏览',
        es: 'Explorar', fr: 'Parcourir', de: 'Durchsuchen',
        ko: '둘러보기', ar: 'تصفح', pt: 'Explorar', it: 'Esplora'
    },
    library: {
        en: 'Library', ja: 'ライブラリ', zh: '书库',
        es: 'Biblioteca', fr: 'Biblioth\u00e8que', de: 'Bibliothek',
        ko: '라이브러리', ar: 'المكتبة', pt: 'Biblioteca', it: 'Libreria'
    },
    dashboard: {
        en: 'Dashboard', ja: 'ダッシュボード', zh: '控制台',
        es: 'Panel', fr: 'Tableau de bord', de: 'Dashboard',
        ko: '대시보드', ar: 'لوحة التحكم', pt: 'Painel', it: 'Pannello'
    },
    tools: {
        en: 'Tools', ja: 'ツール', zh: '工具',
        es: 'Herramientas', fr: 'Outils', de: 'Werkzeuge',
        ko: '도구', ar: 'أدوات', pt: 'Ferramentas', it: 'Strumenti'
    },
    uploadWork: {
        en: 'Upload Work', ja: '作品アップロード', zh: '上传作品',
        es: 'Subir obra', fr: 'T\u00e9l\u00e9charger', de: 'Werk hochladen',
        ko: '작품 업로드', ar: 'رفع عمل', pt: 'Enviar obra', it: 'Carica opera'
    },
    textEditor: {
        en: 'Text Editor', ja: 'テキストエディター', zh: '文本编辑器',
        es: 'Editor de texto', fr: 'Éditeur de texte', de: 'Text-Editor',
        ko: '텍스트 편집기', ar: 'محرر النصوص', pt: 'Editor de texto', it: 'Editor di testo'
    },
    translationTools: {
        en: 'Translation Tools', ja: '翻訳ツール', zh: '翻译工具',
        es: 'Herramientas de traducci\u00f3n', fr: 'Outils de traduction', de: '\u00dcbersetzungstools',
        ko: '번역 도구', ar: 'أدوات الترجمة', pt: 'Ferramentas de tradu\u00e7\u00e3o', it: 'Strumenti di traduzione'
    },
    mangaTranslator: {
        en: 'Manga Translator', ja: 'マンガ翻訳', zh: '漫画翻译',
        es: 'Traductor de Manga', fr: 'Traducteur de Manga', de: 'Manga-\u00dcbersetzer',
        ko: '만화 번역기', ar: 'مترجم المانجا', pt: 'Tradutor de Mang\u00e1', it: 'Traduttore Manga'
    },
    mangaEditor: {
        en: 'Manga Editor', ja: 'マンガエディター', zh: '漫画编辑器',
        es: 'Editor de Manga', fr: '\u00c9diteur de Manga', de: 'Manga-Editor',
        ko: '만화 편집기', ar: 'محرر المانجا', pt: 'Editor de Mang\u00e1', it: 'Editor Manga'
    },
    novelTranslator: {
        en: 'Novel Translator', ja: '小説翻訳', zh: '小说翻译',
        es: 'Traductor de Novela', fr: 'Traducteur de Roman', de: 'Roman-\u00dcbersetzer',
        ko: '소설 번역기', ar: 'مترجم الروايات', pt: 'Tradutor de Romance', it: 'Traduttore Romanzi'
    },
    aiEditor: {
        en: 'AI Editor', ja: 'AIエディター', zh: 'AI編輯器',
        es: 'Editor IA', fr: 'Éditeur IA', de: 'KI-Editor',
        ko: 'AI 편집기', ar: 'محرر الذكاء الاصطناعي',
        pt: 'Editor IA', it: 'Editor IA'
    },
    translationStatus: {
        en: 'Translation Status', ja: '翻訳状況', zh: '翻译状态',
        es: 'Estado de traducci\u00f3n', fr: 'Statut de traduction', de: '\u00dcbersetzungsstatus',
        ko: '번역 상태', ar: 'حالة الترجمة', pt: 'Status da tradu\u00e7\u00e3o', it: 'Stato traduzione'
    },
    findTranslators: {
        en: 'Find Translators', ja: '翻訳者を探す', zh: '寻找翻译',
        es: 'Buscar traductores', fr: 'Trouver des traducteurs', de: '\u00dcbersetzer finden',
        ko: '번역가 찾기', ar: 'البحث عن مترجمين', pt: 'Encontrar tradutores', it: 'Trova traduttori'
    },
    findEditors: {
        en: 'Find Editors', ja: '編集者を探す', zh: '寻找编辑',
        es: 'Buscar editores', fr: 'Trouver des \u00e9diteurs', de: 'Editoren finden',
        ko: '편집자 찾기', ar: 'البحث عن محررين', pt: 'Encontrar editores', it: 'Trova redattori'
    },
    messages: {
        en: 'Messages', ja: 'メッセージ', zh: '消息',
        es: 'Mensajes', fr: 'Messages', de: 'Nachrichten',
        ko: '메시지', ar: 'الرسائل', pt: 'Mensagens', it: 'Messaggi'
    },
    support: {
        en: 'Support', ja: 'サポート', zh: '支持',
        es: 'Soporte', fr: 'Support', de: 'Support',
        ko: '지원', ar: 'الدعم', pt: 'Suporte', it: 'Supporto'
    },
    faq: {
        en: 'FAQ', ja: 'よくある質問', zh: '常见问题',
        es: 'Preguntas frecuentes', fr: 'FAQ', de: 'FAQ',
        ko: '자주 묻는 질문', ar: 'الأسئلة الشائعة', pt: 'Perguntas frequentes', it: 'FAQ'
    },
    troubleshooting: {
        en: 'Troubleshooting', ja: 'トラブルシューティング', zh: '故障排除',
        es: 'Soluci\u00f3n de problemas', fr: 'D\u00e9pannage', de: 'Fehlerbehebung',
        ko: '문제 해결', ar: 'استكشاف الأخطاء', pt: 'Solu\u00e7\u00e3o de problemas', it: 'Risoluzione problemi'
    },
    contact: {
        en: 'Contact', ja: 'お問い合わせ', zh: '联系我们',
        es: 'Contacto', fr: 'Contact', de: 'Kontakt',
        ko: '문의', ar: 'اتصل بنا', pt: 'Contato', it: 'Contatti'
    },
    signIn: {
        en: 'Sign In', ja: 'ログイン', zh: '登录',
        es: 'Iniciar sesi\u00f3n', fr: 'Se connecter', de: 'Anmelden',
        ko: '로그인', ar: 'تسجيل الدخول', pt: 'Entrar', it: 'Accedi'
    },
    getStarted: {
        en: 'Get Started', ja: '始める', zh: '开始',
        es: 'Comenzar', fr: 'Commencer', de: 'Loslegen',
        ko: '시작하기', ar: 'ابدأ', pt: 'Come\u00e7ar', it: 'Inizia'
    },
    profile: {
        en: 'Profile', ja: 'プロフィール', zh: '个人资料',
        es: 'Perfil', fr: 'Profil', de: 'Profil',
        ko: '프로필', ar: 'الملف الشخصي', pt: 'Perfil', it: 'Profilo'
    },
    myWorks: {
        en: 'My Works', ja: 'マイ作品', zh: '我的作品',
        es: 'Mis obras', fr: 'Mes \u0153uvres', de: 'Meine Werke',
        ko: '내 작품', ar: 'أعمالي', pt: 'Minhas obras', it: 'Le mie opere'
    },
    accountSettings: {
        en: 'Account Settings', ja: 'アカウント設定', zh: '账户设置',
        es: 'Configuraci\u00f3n de cuenta', fr: 'Param\u00e8tres du compte', de: 'Kontoeinstellungen',
        ko: '계정 설정', ar: 'إعدادات الحساب', pt: 'Configura\u00e7\u00f5es da conta', it: 'Impostazioni account'
    },
    logout: {
        en: 'Log Out', ja: 'ログアウト', zh: '退出登录',
        es: 'Cerrar sesi\u00f3n', fr: 'D\u00e9connexion', de: 'Abmelden',
        ko: '로그아웃', ar: 'تسجيل الخروج', pt: 'Sair', it: 'Esci'
    },
    registerTranslator: {
        en: 'Register as Translator', ja: '翻訳者登録', zh: '注册为翻译',
        es: 'Registrarse como traductor', fr: 'Devenir traducteur', de: 'Als Übersetzer registrieren',
        ko: '번역가 등록', ar: 'التسجيل كمترجم', pt: 'Registrar-se como tradutor', it: 'Registrati come traduttore'
    },
    registerEditor: {
        en: 'Register as Editor', ja: '編集者登録', zh: '注册为编辑',
        es: 'Registrarse como editor', fr: 'Devenir éditeur', de: 'Als Lektor registrieren',
        ko: '편집자 등록', ar: 'التسجيل كمحرر', pt: 'Registrar-se como editor', it: 'Registrati come editor'
    },
    logOutConfirm: {
        en: 'Are you sure you want to log out?', ja: 'ログアウトしますか？', zh: '确定要退出登录吗？',
        es: '\u00bfEst\u00e1s seguro de que quieres cerrar sesi\u00f3n?', fr: '\u00cates-vous s\u00fbr de vouloir vous d\u00e9connecter?', de: 'Sind Sie sicher, dass Sie sich abmelden m\u00f6chten?',
        ko: '로그아웃 하시겠습니까?', ar: 'هل أنت متأكد أنك تريد تسجيل الخروج؟', pt: 'Tem certeza que deseja sair?', it: 'Sei sicuro di voler uscire?'
    },
    help: {
        en: 'Help', ja: 'ヘルプ', zh: '帮助',
        es: 'Ayuda', fr: 'Aide', de: 'Hilfe',
        ko: '도움말', ar: 'مساعدة', pt: 'Ajuda', it: 'Aiuto'
    },
    terms: {
        en: 'Terms', ja: '利用規約', zh: '条款',
        es: 'T\u00e9rminos', fr: 'Conditions', de: 'Nutzungsbedingungen',
        ko: '이용약관', ar: 'الشروط', pt: 'Termos', it: 'Termini'
    },
    privacy: {
        en: 'Privacy', ja: 'プライバシー', zh: '隐私',
        es: 'Privacidad', fr: 'Confidentialit\u00e9', de: 'Datenschutz',
        ko: '개인정보', ar: 'الخصوصية', pt: 'Privacidade', it: 'Privacy'
    },
    allRights: {
        en: 'All rights reserved.', ja: '全著作権所有。', zh: '保留所有权利。',
        es: 'Todos los derechos reservados.', fr: 'Tous droits r\u00e9serv\u00e9s.', de: 'Alle Rechte vorbehalten.',
        ko: '모든 권리 보유.', ar: 'جميع الحقوق محفوظة.', pt: 'Todos os direitos reservados.', it: 'Tutti i diritti riservati.'
    }
};

// ========== Language options ==========
var _langOptions = [
    { value: 'en', label: '\ud83c\uddec\ud83c\udde7 EN' },
    { value: 'ja', label: '\ud83c\uddef\ud83c\uddf5 \u65e5\u672c\u8a9e' },
    { value: 'zh', label: '\ud83c\udde8\ud83c\uddf3 \u7b80\u4f53\u4e2d\u6587' },
    { value: 'zh-TW', label: '\ud83c\uddf9\ud83c\uddfc \u7e41\u9ad4\u4e2d\u6587' },
    { value: 'es', label: '\ud83c\uddea\ud83c\uddf8 ES' },
    { value: 'fr', label: '\ud83c\uddeb\ud83c\uddf7 FR' },
    { value: 'de', label: '\ud83c\udde9\ud83c\uddea DE' },
    { value: 'ko', label: '\ud83c\uddf0\ud83c\uddf7 \ud55c\uad6d\uc5b4' },
    { value: 'ar', label: '\ud83c\uddf8\ud83c\udde6 \u0639\u0631\u0628\u064a' },
    { value: 'pt', label: '\ud83c\udde7\ud83c\uddf7 PT' },
    { value: 'it', label: '🇮🇹 IT' }
];

// ========== Core functions ==========

function getCurrentLanguage() {
    // Check i18n engine first, then localStorage
    if (typeof i18n !== 'undefined' && i18n.getCurrentLanguage) {
        return i18n.getCurrentLanguage();
    }
    return localStorage.getItem('preferredLanguage') || 'en';
}
var getCurrentLang = getCurrentLanguage;

function getL(obj) {
    if (!obj) return '';
    var lang = getCurrentLanguage();
    if (obj[lang]) return obj[lang];
    // 各ページに直接書かれた文言（uiText）には 'zh-TW' の項が無いものが多い。
    // 英語に落ちる前に簡体字を試す。字体は違っても中国語の読者には通じる
    if (lang === 'zh-TW' && obj.zh) return obj.zh;
    return obj.en || '';
}

// ========== Work price formatting (multi-currency) ==========

function formatWorkPrice(price, currency) {
    var symbols = { USD: '$', JPY: '¥', EUR: '€', GBP: '£', KRW: '₩', CNY: '¥', BRL: 'R$', SAR: '﷼' };
    var zeroDecimal = ['JPY', 'KRW'];
    var cur = (currency || 'USD').toUpperCase();
    var symbol = symbols[cur] || (cur + ' ');
    var n = Number(price) || 0;
    return symbol + (zeroDecimal.indexOf(cur) >= 0 ? Math.round(n).toLocaleString() : n.toFixed(2));
}

// ========== AI disclosure badge (multi-language, shared) ==========
// 本文と表紙のAI利用をそれぞれ表示（例: 本文: 部分的AI / 表紙: AI生成）

// ===== AI利用の開示バッジ =====
// 1本の帯に「本文: AI生成 / 表紙: 部分的AI」と書くと横に長く、表紙の絵を隠す。
// 用途ごとに色を分けた小さな札にすれば、細くしても何のことか見て分かる。
// 色だけに意味を持たせず、札に必ず語（本文/表紙/翻訳）を入れる
// （色が見分けにくい人にも伝わるようにするため）。
var AI_BADGE_COLORS = {
    text: '#C0392B',        // 本文 — 赤
    cover: '#2C5F8A',       // 表紙 — 青
    translation: '#8A6D00'  // 翻訳 — 黄（白文字が読める濃さにしてある）
};

var AI_BADGE_AREAS = {
    text: { en: 'Text', ja: '本文', zh: '正文', es: 'Texto', fr: 'Texte', de: 'Text', ko: '본문', ar: 'النص', pt: 'Texto', it: 'Testo' },
    cover: { en: 'Cover', ja: '表紙', zh: '封面', es: 'Portada', fr: 'Couverture', de: 'Cover', ko: '표지', ar: 'الغلاف', pt: 'Capa', it: 'Copertina' },
    translation: { en: 'Translation', ja: '翻訳', zh: '翻译', es: 'Traducción', fr: 'Traduction', de: 'Übersetzung', ko: '번역', ar: 'الترجمة', pt: 'Tradução', it: 'Traduzione' }
};

var AI_BADGE_LEVELS = {
    full: {
        short: { en: 'AI', ja: 'AI', zh: 'AI', es: 'IA', fr: 'IA', de: 'KI', ko: 'AI', ar: 'ذكاء', pt: 'IA', it: 'IA' },
        long: { en: 'AI-generated', ja: 'AI生成', zh: 'AI生成', es: 'generado por IA', fr: 'généré par IA', de: 'KI-generiert', ko: 'AI 생성', ar: 'مولد بالذكاء الاصطناعي', pt: 'gerado por IA', it: 'generato da IA' }
    },
    part: {
        short: { en: 'part-AI', ja: '一部AI', zh: '部分AI', es: 'IA parcial', fr: 'IA partielle', de: 'teils KI', ko: '일부 AI', ar: 'جزئي', pt: 'IA parcial', it: 'IA parziale' },
        long: { en: 'partly AI', ja: '部分的AI', zh: '部分AI', es: 'parcialmente IA', fr: 'partiellement IA', de: 'teilweise KI', ko: '부분적 AI', ar: 'ذكاء اصطناعي جزئي', pt: 'parcialmente IA', it: 'parzialmente IA' }
    }
};

/** 用途ごとの札を作る。AIを使っていない用途は札を出さない */
function getAiBadges(textUsage, coverUsage, translationUsage) {
    var level = function (u) {
        if (u === 'generated' || u === 'full_ai') return 'full';
        if (u === 'assisted') return 'part';
        return null;   // 'none' / 'na' / 未設定 は表示しない
    };
    var badges = [];
    [['text', textUsage], ['cover', coverUsage], ['translation', translationUsage]].forEach(function (pair) {
        var key = pair[0];
        var lv = level(pair[1]);
        if (!lv) return;
        var area = getL(AI_BADGE_AREAS[key]);
        badges.push({
            key: key,
            color: AI_BADGE_COLORS[key],
            short: area + ' ' + getL(AI_BADGE_LEVELS[lv].short),
            full: area + ': ' + getL(AI_BADGE_LEVELS[lv].long)
        });
    });
    return badges;
}

function _escAttr(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * 表紙の下に重ねる開示バッジのHTML。該当が無ければ空文字。
 * 呼び出し側の表紙要素は position:relative であること。
 */
function aiBadgesHtml(textUsage, coverUsage, translationUsage) {
    var badges = getAiBadges(textUsage, coverUsage, translationUsage);
    if (!badges.length) return '';
    var chips = badges.map(function (b) {
        return '<span title="' + _escAttr(b.full) + '" style="padding:1px 6px; border-radius:4px;'
            + ' font-size:0.65rem; font-weight:700; line-height:1.6; white-space:nowrap;'
            + ' background:' + b.color + '; color:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.3);">'
            + _escAttr(b.short) + '</span>';
    }).join('');
    return '<div style="position:absolute; bottom:6px; left:4px; right:4px; display:flex;'
        + ' gap:3px; justify-content:center; flex-wrap:wrap; pointer-events:none;">' + chips + '</div>';
}

window.getAiBadges = getAiBadges;
window.aiBadgesHtml = aiBadgesHtml;

function getAiBadgeLabel(textUsage, coverUsage) {
    var levelLabel = function(u) {
        if (u === 'generated' || u === 'full_ai') {
            return getL({ en: 'AI-generated', ja: 'AI生成', zh: 'AI生成', es: 'generado por IA', fr: 'généré par IA', de: 'KI-generiert', ko: 'AI 생성', ar: 'مولد بالذكاء الاصطناعي', pt: 'gerado por IA', it: 'generato da IA' });
        }
        if (u === 'assisted') {
            return getL({ en: 'partly AI', ja: '部分的AI', zh: '部分AI', es: 'parcialmente IA', fr: 'partiellement IA', de: 'teilweise KI', ko: '부분적 AI', ar: 'ذكاء اصطناعي جزئي', pt: 'parcialmente IA', it: 'parzialmente IA' });
        }
        return null;
    };
    var t = levelLabel(textUsage);
    var c = (coverUsage === 'na') ? null : levelLabel(coverUsage);
    var parts = [];
    if (t) {
        parts.push(getL({ en: 'Text', ja: '本文', zh: '正文', es: 'Texto', fr: 'Texte', de: 'Text', ko: '본문', ar: 'النص', pt: 'Texto', it: 'Testo' }) + ': ' + t);
    }
    if (c) {
        parts.push(getL({ en: 'Cover', ja: '表紙', zh: '封面', es: 'Portada', fr: 'Couverture', de: 'Cover', ko: '표지', ar: 'الغلاف', pt: 'Capa', it: 'Copertina' }) + ': ' + c);
    }
    return parts.length ? parts.join(' / ') : null;
}

// ========== Price formatting (multi-currency) ==========

// 通貨記号付きで価格を整形（JPY/KRWは小数なし）。作品価格の表示用。
// NOTE: 名前は formatWorkPrice にすること — ウィザード各ページ（ai-editor等）が
// ローカルに formatPrice を定義しており、navbar.js は後から読み込まれるため
// 同名のグローバル関数を定義するとページ側の関数を上書きして通貨表示が壊れる
function formatWorkPrice(price, currency) {
    var cur = (currency || 'USD').toUpperCase();
    var SYMBOLS = { USD: '$', JPY: '¥', EUR: '€', GBP: '£', KRW: '₩', CNY: '¥', BRL: 'R$', SAR: 'SAR ' };
    var ZERO_DECIMAL = ['JPY', 'KRW'];
    var n = parseFloat(price) || 0;
    var sym = SYMBOLS[cur] || (cur + ' ');
    return sym + (ZERO_DECIMAL.indexOf(cur) !== -1 ? Math.round(n).toLocaleString() : n.toFixed(2));
}

// ========== Path prefix auto-detection ==========

function detectPathPrefix() {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    // Subdirectories under pages/ need '../'
    if (/\/pages\/(support|admin|feedback|translators|editors|dev)\//.test(path)) {
        return '../';
    }
    // Direct children of pages/
    if (/\/pages\//.test(path)) {
        return '';
    }
    // Root level (index.html etc.)
    return 'pages/';
}

// ========== Active page auto-detection ==========

function _detectActivePage() {
    var path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    var file = path.split('/').pop().replace('.html', '') || 'index';

    // Map filenames to activePage keys
    var map = {
        'browse': 'browse',
        'library': 'library',
        'dashboard': 'dashboard',
        'my-works': 'my-works',
        'upload': 'upload',
        'manga-translator': 'manga-translator',
        'manga-editor': 'manga-editor',
        'novel-translator': 'novel-translator',
        'ai-editor': 'ai-editor',
        'translation-status': 'translation-status',
        'messages': 'messages',
        'faq': 'faq',
        'troubleshoot': 'troubleshoot',
        'contact': 'contact',
        'tickets': 'tickets',
        'index': 'index'
    };

    // Check for subdirectory-based pages
    if (/\/translators\//.test(path)) return 'translators';
    if (/\/editors\//.test(path)) return 'editors';
    if (/\/support\//.test(path)) {
        return map[file] || 'support';
    }
    if (/\/admin\//.test(path)) return 'admin';
    if (/\/feedback\//.test(path)) return 'feedback';

    return map[file] || file;
}

// ========== Build language selector HTML ==========

function _buildLangOptions() {
    var html = '';
    for (var i = 0; i < _langOptions.length; i++) {
        html += '<option value="' + _langOptions[i].value + '">' + _langOptions[i].label + '</option>';
    }
    return html;
}

// ========== renderNavbar ==========

function renderNavbar(options) {
    options = options || {};
    var prefix = options.pathPrefix != null ? options.pathPrefix : detectPathPrefix();
    var activePage = options.activePage || _detectActivePage();

    // Determine the base prefix for links going to pages/ directory
    // prefix '' = we are in pages/, prefix '../' = we are in pages/sub/, prefix 'pages/' = we are at root
    var pagesPrefix = prefix; // links to sibling pages
    var indexLink = prefix === 'pages/' ? 'index.html' : (prefix + '../index.html');
    // For items in pages/ directory
    var p = function(file) { return prefix + file; };
    // For index.html link
    if (prefix === 'pages/') {
        // We are at root, pages are in pages/
        p = function(file) { return 'pages/' + file; };
        indexLink = 'index.html';
    } else if (prefix === '../') {
        // We are in pages/sub/, sibling pages need ../
        p = function(file) { return '../' + file; };
        indexLink = '../../index.html';
    } else {
        // We are in pages/, prefix is ''
        p = function(file) { return file; };
        indexLink = '../index.html';
    }

    var langOpts = _buildLangOptions();

    // Helper: active class
    function ac(page) {
        return activePage === page ? ' active' : '';
    }

    // Tools dropdown items that determine if Tools is active
    var toolsPages = ['upload', 'manga-translator', 'manga-editor', 'novel-translator', 'ai-editor', 'translation-status', 'translators', 'editors'];
    var toolsActive = toolsPages.indexOf(activePage) !== -1;

    // Support dropdown items
    var supportPages = ['help', 'faq', 'troubleshoot', 'support', 'contact', 'tickets'];
    var supportActive = supportPages.indexOf(activePage) !== -1;

    var html = '';

    // Overlay
    html += '<div class="navbar-overlay d-xl-none" id="navbarOverlay"></div>';

    // Nav start
    html += '<nav class="navbar navbar-expand-xl navbar-custom sticky-top">';
    html += '<div class="container">';

    // Brand
    html += '<a class="navbar-brand" href="' + indexLink + '">';
    html += '<i class="fas fa-book-open"></i> AuctLect';
    html += '</a>';

    // Mobile language selector
    html += '<div class="navbar-lang-selector d-xl-none">';
    html += '<select class="language-selector" id="languageSelectorMobile">';
    html += langOpts;
    html += '</select>';
    html += '</div>';

    // User dropdown (auth-only)
    html += '<div class="user-dropdown auth-only" id="userDropdown">';
    html += '<button type="button" class="user-dropdown-toggle" id="userDropdownBtn" onclick="toggleUserDropdown(event)">';
    html += '<i class="fas fa-user-circle"></i>';
    html += '<span class="user-name d-none d-xl-inline" id="userName">User</span>';
    html += '<i class="fas fa-chevron-down user-chevron d-none d-xl-inline"></i>';
    html += '</button>';
    html += '<div class="user-menu" id="userMenu">';
    html += '<div class="user-menu-header">';
    html += '<div class="user-avatar"><i class="fas fa-user-circle"></i></div>';
    html += '<div class="user-info">';
    html += '<div class="user-display-name" id="userDisplayName">User</div>';
    html += '<div class="user-email" id="userEmail">user@example.com</div>';
    html += '</div></div>';
    html += '<div class="user-menu-divider"></div>';
    html += '<a href="' + p('dashboard.html') + '" class="user-menu-item">';
    html += '<i class="fas fa-th-large"></i> <span id="menuDashboard">Dashboard</span></a>';
    html += '<a href="' + p('profile.html') + '" class="user-menu-item">';
    html += '<i class="fas fa-user-circle"></i> <span id="menuProfile">Profile</span></a>';
    html += '<a href="' + p('account-settings.html') + '" class="user-menu-item">';
    html += '<i class="fas fa-cog"></i> <span id="menuAccountSettings">Account Settings</span></a>';
    // 翻訳者・編集者としての活動開始（誰でも登録できる。ディレクトリに公開プロフィールが載る）
    html += '<div class="user-menu-divider"></div>';
    html += '<a href="' + p('translators/register.html') + '" class="user-menu-item">';
    html += '<i class="fas fa-language"></i> <span id="menuRegisterTranslator">Register as Translator</span></a>';
    html += '<a href="' + p('editors/register.html') + '" class="user-menu-item">';
    html += '<i class="fas fa-pen-nib"></i> <span id="menuRegisterEditor">Register as Editor</span></a>';
    html += '<div class="user-menu-divider"></div>';
    html += '<button class="user-menu-item logout-btn" onclick="handleLogout()">';
    html += '<i class="fas fa-sign-out-alt"></i> <span id="menuLogout">Log Out</span></button>';
    html += '</div></div>';

    // Mobile: 常時表示のメッセージアイコン（ハンバーガーを開かなくても未読が分かる）
    html += '<a class="msg-icon-mobile position-relative" href="' + p('messages.html') + '" id="navMsgIconMobile" style="padding: 0.35rem 0.55rem; margin-right: 0.25rem; color: var(--color-text, #2D2A26); text-decoration: none;">';
    html += '<i class="fas fa-envelope" style="font-size: 1.25rem;"></i>';
    html += '<span class="msg-badge" id="msgBadgeMobileTop" style="display:none;"></span>';
    html += '</a>';

    // Hamburger
    html += '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">';
    html += '<span class="navbar-toggler-icon"></span>';
    html += '</button>';

    // Collapse start
    html += '<div class="collapse navbar-collapse" id="navbarNav">';

    // ===== PC Navigation =====
    html += '<ul class="navbar-nav me-auto d-none d-xl-flex">';

    // Browse
    html += '<li class="nav-item">';
    html += '<a class="nav-link' + ac('browse') + '" href="' + p('browse.html') + '">';
    html += '<i class="fas fa-compass me-1"></i> <span id="navBrowsePC">' + getL(navText.browse) + '</span></a></li>';

    // Library (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('library') + '" href="' + p('library.html') + '">';
    html += '<i class="fas fa-book-reader me-1"></i> <span id="navLibraryPC">' + getL(navText.library) + '</span></a></li>';

    // Dashboard (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('dashboard') + '" href="' + p('dashboard.html') + '">';
    html += '<i class="fas fa-th-large me-1"></i> <span id="navDashboardPC">' + getL(navText.dashboard) + '</span></a></li>';

    // My Works (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('my-works') + '" href="' + p('my-works.html') + '">';
    html += '<i class="fas fa-pen-fancy me-1"></i> <span id="navMyWorksPC">' + getL(navText.myWorks) + '</span></a></li>';

    // Tools dropdown (auth)
    html += '<li class="nav-item dropdown auth-only">';
    html += '<a class="nav-link dropdown-toggle' + (toolsActive ? ' active' : '') + '" href="#" role="button" data-bs-toggle="dropdown">';
    html += '<i class="fas fa-toolbox me-1"></i> <span id="navToolsPC">' + getL(navText.tools) + '</span></a>';
    html += '<ul class="dropdown-menu">';
    html += '<li><a class="dropdown-item" href="' + p('upload.html') + '"><i class="fas fa-upload me-2"></i><span id="navUploadPC">' + getL(navText.uploadWork) + '</span></a></li>';
    html += '<li><hr class="dropdown-divider"></li>';
    html += '<li><a class="dropdown-item" href="' + p('editor.html') + '"><i class="fas fa-pen me-2"></i><span id="navTextEditorPC">' + getL(navText.textEditor) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('manga-translator.html') + '"><i class="fas fa-image me-2"></i><span id="navMangaTranslatorPC">' + getL(navText.mangaTranslator) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('manga-editor.html') + '"><i class="fas fa-edit me-2"></i><span id="navMangaEditorPC">' + getL(navText.mangaEditor) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('novel-translator.html') + '"><i class="fas fa-book me-2"></i><span id="navNovelTranslatorPC">' + getL(navText.novelTranslator) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('ai-editor.html') + '"><i class="fas fa-spell-check me-2"></i><span id="navAiEditorPC">' + getL(navText.aiEditor) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('translation-status.html') + '"><i class="fas fa-tasks me-2"></i><span id="navTranslationStatusPC">' + getL(navText.translationStatus) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('translators/index.html') + '"><i class="fas fa-users me-2"></i><span id="navFindTranslatorsPC">' + getL(navText.findTranslators) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('editors/index.html') + '"><i class="fas fa-pen-fancy me-2"></i><span id="navFindEditorsPC">' + getL(navText.findEditors) + '</span></a></li>';
    html += '</ul></li>';

    // Support dropdown
    html += '<li class="nav-item dropdown">';
    html += '<a class="nav-link dropdown-toggle' + (supportActive ? ' active' : '') + '" href="#" role="button" data-bs-toggle="dropdown">';
    html += '<i class="fas fa-headset me-1"></i> <span id="navSupportPC">' + getL(navText.support) + '</span></a>';
    html += '<ul class="dropdown-menu">';
    html += '<li><a class="dropdown-item" href="' + p('support/help.html') + '"><i class="fas fa-life-ring me-2"></i><span id="navHelpPC">' + getL(navText.help) + '</span></a></li>';
    html += '</ul></li>';

    // Messages (auth) with unread badge
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('messages') + ' position-relative" href="' + p('messages.html') + '">';
    html += '<i class="fas fa-envelope me-1"></i> <span id="navMessagesPC">' + getL(navText.messages) + '</span>';
    html += '<span class="msg-badge" id="msgBadgePC" style="display:none;"></span>';
    html += '</a></li>';

    html += '</ul>';

    // ===== Mobile Navigation =====
    html += '<ul class="navbar-nav d-xl-none">';

    // Browse
    html += '<li class="nav-item">';
    html += '<a class="nav-link' + ac('browse') + '" href="' + p('browse.html') + '">';
    html += '<i class="fas fa-compass me-2"></i><span id="navBrowseMobile">' + getL(navText.browse) + '</span></a></li>';

    // Library (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('library') + '" href="' + p('library.html') + '">';
    html += '<i class="fas fa-book-reader me-2"></i><span id="navLibraryMobile">' + getL(navText.library) + '</span></a></li>';

    html += '<li class="auth-only"><hr class="dropdown-divider"></li>';

    // Dashboard (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('dashboard') + '" href="' + p('dashboard.html') + '">';
    html += '<i class="fas fa-th-large me-2"></i><span id="navDashboardMobile">' + getL(navText.dashboard) + '</span></a></li>';

    // My Works (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('my-works') + '" href="' + p('my-works.html') + '">';
    html += '<i class="fas fa-pen-fancy me-2"></i><span id="navMyWorksMobile">' + getL(navText.myWorks) + '</span></a></li>';

    // Tools collapsible (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link" data-bs-toggle="collapse" href="#translationToolsMenu" role="button">';
    html += '<i class="fas fa-toolbox me-2"></i> <span id="navToolsMobile">' + getL(navText.tools) + '</span>';
    html += '<i class="fas fa-chevron-down ms-auto small"></i></a>';
    html += '<div class="collapse ps-4" id="translationToolsMenu">';
    html += '<a class="nav-link" href="' + p('upload.html') + '"><i class="fas fa-upload me-2"></i> <span id="navUploadMobile">' + getL(navText.uploadWork) + '</span></a>';
    html += '<hr class="dropdown-divider my-1">';
    html += '<a class="nav-link" href="' + p('editor.html') + '"><i class="fas fa-pen me-2"></i><span id="navTextEditorMobile">' + getL(navText.textEditor) + '</span></a>';
    html += '<a class="nav-link" href="' + p('manga-translator.html') + '"><i class="fas fa-image me-2"></i><span id="navMangaTranslatorMobile">' + getL(navText.mangaTranslator) + '</span></a>';
    html += '<a class="nav-link" href="' + p('manga-editor.html') + '"><i class="fas fa-edit me-2"></i><span id="navMangaEditorMobile">' + getL(navText.mangaEditor) + '</span></a>';
    html += '<a class="nav-link" href="' + p('novel-translator.html') + '"><i class="fas fa-book me-2"></i> <span id="navNovelTranslatorMobile">' + getL(navText.novelTranslator) + '</span></a>';
    html += '<a class="nav-link" href="' + p('ai-editor.html') + '"><i class="fas fa-spell-check me-2"></i> <span id="navAiEditorMobile">' + getL(navText.aiEditor) + '</span></a>';
    html += '<a class="nav-link" href="' + p('translation-status.html') + '"><i class="fas fa-tasks me-2"></i><span id="navTranslationStatusMobile">' + getL(navText.translationStatus) + '</span></a>';
    html += '<a class="nav-link" href="' + p('translators/index.html') + '"><i class="fas fa-users me-2"></i><span id="navFindTranslatorsMobile">' + getL(navText.findTranslators) + '</span></a>';
    html += '<a class="nav-link" href="' + p('editors/index.html') + '"><i class="fas fa-pen-fancy me-2"></i> <span id="navFindEditorsMobile">' + getL(navText.findEditors) + '</span></a>';
    html += '</div></li>';

    html += '<li><hr class="dropdown-divider"></li>';

    // Support (mobile - flat links)
    html += '<li class="nav-item">';
    html += '<a class="nav-link' + ac('help') + '" href="' + p('support/help.html') + '">';
    html += '<i class="fas fa-life-ring me-2"></i><span id="navHelpMobile">' + getL(navText.help) + '</span></a></li>';

    html += '<li><hr class="dropdown-divider"></li>';

    // Guest: Sign In / Get Started
    html += '<li class="nav-item guest-only">';
    html += '<a class="nav-link" href="' + p('login.html') + '">';
    html += '<i class="fas fa-sign-in-alt me-2"></i><span id="navSignInMobile">' + getL(navText.signIn) + '</span></a></li>';

    html += '<li class="nav-item guest-only">';
    html += '<a class="nav-link" href="' + p('register.html') + '">';
    html += '<i class="fas fa-user-plus me-2"></i><span id="navGetStartedMobile">' + getL(navText.getStarted) + '</span></a></li>';

    html += '<li><hr class="dropdown-divider"></li>';

    // Messages (auth, mobile) with unread badge
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('messages') + ' position-relative" href="' + p('messages.html') + '">';
    html += '<i class="fas fa-envelope me-2"></i> <span id="navMessagesMobile">' + getL(navText.messages) + '</span>';
    html += '<span class="msg-badge" id="msgBadgeMobile" style="display:none;"></span>';
    html += '</a></li>';

    html += '</ul>';

    // ===== Right side (PC) =====
    html += '<div class="d-none d-xl-flex align-items-center gap-3">';

    // Language selector PC
    html += '<select class="language-selector" id="languageSelector">';
    html += langOpts;
    html += '</select>';

    // Guest buttons (PC)
    html += '<div class="navbar-buttons-guest guest-only d-none d-xl-flex">';
    html += '<a href="' + p('login.html') + '" class="btn btn-soft-custom">';
    html += '<span id="navSignInPC">' + getL(navText.signIn) + '</span></a>';
    html += '<a href="' + p('register.html') + '" class="btn btn-primary-custom">';
    html += '<span id="navGetStartedPC">' + getL(navText.getStarted) + '</span></a>';
    html += '</div>';

    html += '</div>';

    // Close collapse, container, nav
    html += '</div></div></nav>';

    // Insert into container - use outerHTML to replace the div itself
    // so that <nav sticky-top> is a direct child of <body>
    var container = document.getElementById('navbar-container');
    if (container) {
        container.outerHTML = html;
    }
    return html;
}

// ========== renderFooter ==========

function renderFooter(options) {
    options = options || {};
    var prefix = options.pathPrefix != null ? options.pathPrefix : detectPathPrefix();

    // Build the link prefix for pages
    var p;
    if (prefix === 'pages/') {
        p = function(file) { return 'pages/' + file; };
    } else if (prefix === '../') {
        p = function(file) { return '../' + file; };
    } else {
        p = function(file) { return file; };
    }

    var html = '<footer class="footer-custom">';
    html += '<div class="container">';
    html += '<div class="d-flex flex-wrap justify-content-between align-items-center">';
    html += '<p class="small mb-0" id="footerCopyright">&copy; 2025 AuctLect. ' + getL(navText.allRights) + '</p>';
    html += '<div class="d-flex gap-3">';
    html += '<a href="' + p('support/help.html') + '" class="text-secondary" id="footerHelp">' + getL(navText.help) + '</a>';
    html += '<a href="' + p('terms.html') + '" class="text-secondary" id="footerTerms">' + getL(navText.terms) + '</a>';
    html += '<a href="' + p('privacy.html') + '" class="text-secondary" id="footerPrivacy">' + getL(navText.privacy) + '</a>';
    html += '</div></div></div></footer>';

    var container = document.getElementById('footer-container');
    if (container) {
        container.outerHTML = html;
    }
    return html;
}

// ========== updateNavText ==========

function updateNavText() {
    // User dropdown menu items
    var menuDashboard = document.getElementById('menuDashboard');
    var menuAccountSettings = document.getElementById('menuAccountSettings');
    var menuLogout = document.getElementById('menuLogout');
    if (menuDashboard) menuDashboard.textContent = getL(navText.dashboard);
    if (menuAccountSettings) menuAccountSettings.textContent = getL(navText.accountSettings);
    if (menuLogout) menuLogout.textContent = getL(navText.logout);
    var menuRegTr = document.getElementById('menuRegisterTranslator');
    var menuRegEd = document.getElementById('menuRegisterEditor');
    if (menuRegTr) menuRegTr.textContent = getL(navText.registerTranslator);
    if (menuRegEd) menuRegEd.textContent = getL(navText.registerEditor);

    // All nav elements (PC + Mobile)
    var els = {
        navBrowsePC: navText.browse,
        navLibraryPC: navText.library,
        navDashboardPC: navText.dashboard,
        navToolsPC: navText.tools,
        navUploadPC: navText.uploadWork,
        navTextEditorPC: navText.textEditor,
        navMangaTranslatorPC: navText.mangaTranslator,
        navMangaEditorPC: navText.mangaEditor,
        navNovelTranslatorPC: navText.novelTranslator,
        navAiEditorPC: navText.aiEditor,
        navTranslationStatusPC: navText.translationStatus,
        navFindTranslatorsPC: navText.findTranslators,
        navFindEditorsPC: navText.findEditors,
        navSupportPC: navText.support,
        navFaqPC: navText.faq,
        navHelpPC: navText.help,
        navMessagesPC: navText.messages,
        navSignInPC: navText.signIn,
        navGetStartedPC: navText.getStarted,
        navBrowseMobile: navText.browse,
        navLibraryMobile: navText.library,
        navDashboardMobile: navText.dashboard,
        navToolsMobile: navText.tools,
        navUploadMobile: navText.uploadWork,
        navTextEditorMobile: navText.textEditor,
        navMangaTranslatorMobile: navText.mangaTranslator,
        navMangaEditorMobile: navText.mangaEditor,
        navNovelTranslatorMobile: navText.novelTranslator,
        navAiEditorMobile: navText.aiEditor,
        navTranslationStatusMobile: navText.translationStatus,
        navFindTranslatorsMobile: navText.findTranslators,
        navFindEditorsMobile: navText.findEditors,
        navFaqMobile: navText.faq,
        navHelpMobile: navText.help,
        navMessagesMobile: navText.messages,
        navSignInMobile: navText.signIn,
        navGetStartedMobile: navText.getStarted
    };
    Object.keys(els).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = getL(els[id]);
    });

    // Footer elements
    var footerHelp = document.getElementById('footerHelp');
    var footerTerms = document.getElementById('footerTerms');
    var footerPrivacy = document.getElementById('footerPrivacy');
    var footerCopyright = document.getElementById('footerCopyright');
    if (footerHelp) footerHelp.textContent = getL(navText.help);
    if (footerTerms) footerTerms.textContent = getL(navText.terms);
    if (footerPrivacy) footerPrivacy.textContent = getL(navText.privacy);
    if (footerCopyright) footerCopyright.innerHTML = '&copy; 2025 AuctLect. ' + getL(navText.allRights);

    // Legacy support: update elements from old Pattern C pages that still have inline navbar HTML
    var menuProfile = document.getElementById('menuProfile');
    var menuMyWorks = document.getElementById('menuMyWorks');
    if (menuProfile) menuProfile.textContent = getL(navText.profile);
    if (menuMyWorks) menuMyWorks.textContent = getL(navText.myWorks);

    // Legacy: old id patterns some pages may still use
    var legacyEls = {
        navTranslationToolsPC: navText.translationTools,
        navTranslationToolsMobile: navText.translationTools,
        navContactPC: navText.contact,
        navContactMobile: navText.contact
    };
    Object.keys(legacyEls).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = getL(legacyEls[id]);
    });
}

// ========== User dropdown ==========

function toggleUserDropdown(e) {
    e.preventDefault();
    e.stopPropagation();
    var dropdown = document.getElementById('userDropdown');
    var dropdownMenu = document.getElementById('userMenu');
    if (dropdown) dropdown.classList.toggle('open');
    if (dropdownMenu) dropdownMenu.classList.toggle('show');
}

function handleLogout() {
    if (confirm(getL(navText.logOutConfirm))) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        var prefix = detectPathPrefix();
        window.location.href = prefix === 'pages/' ? 'index.html' : (prefix + '../index.html');
    }
}

function loadUserInfo() {
    var userStr = localStorage.getItem('user');
    var token = localStorage.getItem('token');
    var isLoggedIn = !!(userStr && token);

    if (isLoggedIn) {
        try {
            var user = JSON.parse(userStr);
            var displayName = user.display_name || user.firstName || user.email || 'User';
            var userNameEl = document.getElementById('userName');
            var userDisplayNameEl = document.getElementById('userDisplayName');
            var userEmailEl = document.getElementById('userEmail');
            if (userNameEl) userNameEl.textContent = displayName;
            if (userDisplayNameEl) userDisplayNameEl.textContent = displayName;
            if (userEmailEl) userEmailEl.textContent = user.email || '';
            document.body.classList.add('logged-in');
        } catch (e) {
            document.body.classList.remove('logged-in');
        }
    } else {
        document.body.classList.remove('logged-in');
    }
}

// ========== ログインの有効期限切れ ==========
// トークンの有効期限は7日。切れたあとの画面は「作品の読み込みに失敗しました:
// Token expired」のように理由の分からない表示になり、利用者は何をすればよいか
// 分からなかった。
//
// fetchを1か所で包んでいるのは、24ページが個別に401を扱う必要があり、
// 書き写すと必ず抜けが出るため（実際、扱っていたのは7ページだけだった）。
var SESSION_RETURN_KEY = 'returnAfterLogin';

function handleSessionExpired() {
    var msg = {
        en: 'Your session has expired. Please log in again — you will come back to this page.',
        ja: 'ログインの有効期限が切れました。もう一度ログインしてください。ログイン後、このページに戻ります。',
        zh: '登录已过期。请重新登录，登录后将返回本页。',
        es: 'Tu sesión ha expirado. Vuelve a iniciar sesión; regresarás a esta página.',
        fr: 'Votre session a expiré. Reconnectez-vous : vous reviendrez sur cette page.',
        de: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an — Sie kehren zu dieser Seite zurück.',
        ko: '로그인이 만료되었습니다. 다시 로그인해 주세요. 로그인 후 이 페이지로 돌아옵니다.',
        ar: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى — ستعود إلى هذه الصفحة.',
        pt: 'Sua sessão expirou. Faça login novamente — você voltará a esta página.',
        it: 'La tua sessione è scaduta. Accedi di nuovo: tornerai a questa pagina.'
    };
    try {
        // ログイン・登録の画面自身を戻り先にすると、ログイン後にまたそこへ戻って堂々巡りになる
        if (!/\/(login|magic-login|register|register-author|register-editor|reset-password)\.html/.test(window.location.pathname)) {
            localStorage.setItem(SESSION_RETURN_KEY, window.location.href);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch (e) {}
    alert(getL(msg));
    var prefix = detectPathPrefix();
    window.location.href = (prefix === 'pages/' ? 'pages/' : prefix) + 'login.html';
}

(function wrapFetchForSessionExpiry(global) {
    if (!global.fetch || global.__sessionExpiryWrapped) return;
    global.__sessionExpiryWrapped = true;

    // ログイン・登録などは401が「合言葉が違う」の意味なので対象外
    var AUTH_ENDPOINTS = /\/api\/auth\//;
    var original = global.fetch.bind(global);
    var handled = false;

    global.fetch = function (input, init) {
        return original(input, init).then(function (resp) {
            try {
                if (handled || resp.status !== 401) return resp;
                var url = typeof input === 'string' ? input : ((input && input.url) || '');
                if (url.indexOf('/api/') === -1 || AUTH_ENDPOINTS.test(url)) return resp;
                // ログイン済みのつもりだった人にだけ知らせる
                if (!localStorage.getItem('token')) return resp;
                handled = true;
                handleSessionExpired();
            } catch (e) { /* 通知に失敗しても本来の応答は返す */ }
            return resp;
        });
    };
})(window);

// ========== 言語を選ぶ欄の文字方向 ==========
// 「原作の言語」「翻訳先」などの選択欄は、選ばれている言語そのものの文字で表示される
// （アラビア語なら العربية）。アラビア語を選んだときはその読み方向に合わせて右寄せにする。
// 対象は data-lang-select が付いた <select>。ジャンルやAI開示のように画面の言語で
// 書かれた選択欄は対象外（そちらは画面の言語に従うのが正しい）。
function applyLangSelectDir(el) {
    if (!el) return;
    if (el.value === 'ar') el.setAttribute('dir', 'rtl');
    else el.removeAttribute('dir');
}

function initLangSelectDir(root) {
    var scope = root || document;
    scope.querySelectorAll('select[data-lang-select]').forEach(function(el) {
        applyLangSelectDir(el);
        if (el.dataset.langDirBound) return;   // 二重登録を防ぐ
        el.dataset.langDirBound = '1';
        el.addEventListener('change', function() { applyLangSelectDir(el); });
    });
}
window.applyLangSelectDir = applyLangSelectDir;
window.initLangSelectDir = initLangSelectDir;

// ========== DOMContentLoaded: Auto-initialization ==========
document.addEventListener('DOMContentLoaded', function() {

    initLangSelectDir();

    // 1. Render navbar if container exists
    var navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        // Check for data attributes for options
        var opts = {};
        if (navContainer.dataset.activePage) {
            opts.activePage = navContainer.dataset.activePage;
        }
        if (navContainer.dataset.pathPrefix !== undefined) {
            opts.pathPrefix = navContainer.dataset.pathPrefix;
        }
        renderNavbar(opts);
    }

    // 2. Render footer if container exists
    var footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        var footerOpts = {};
        if (footerContainer.dataset.pathPrefix !== undefined) {
            footerOpts.pathPrefix = footerContainer.dataset.pathPrefix;
        }
        renderFooter(footerOpts);
    }

    // 3. Initialize language selectors
    var desktopSelector = document.getElementById('languageSelector');
    var mobileSelector = document.getElementById('languageSelectorMobile');

    if (desktopSelector && mobileSelector) {
        var savedLang = localStorage.getItem('preferredLanguage') || 'en';
        desktopSelector.value = savedLang;
        mobileSelector.value = savedLang;

        mobileSelector.addEventListener('change', function() {
            desktopSelector.value = this.value;
            localStorage.setItem('preferredLanguage', this.value);
            if (typeof i18n !== 'undefined' && i18n.setLanguage) i18n.setLanguage(this.value);
            if (typeof changeLanguage === 'function') changeLanguage(this.value);
            updateNavText();
        });

        desktopSelector.addEventListener('change', function() {
            mobileSelector.value = this.value;
            localStorage.setItem('preferredLanguage', this.value);
            if (typeof i18n !== 'undefined' && i18n.setLanguage) i18n.setLanguage(this.value);
            if (typeof changeLanguage === 'function') changeLanguage(this.value);
            updateNavText();
        });
    } else if (desktopSelector) {
        var savedLang2 = localStorage.getItem('preferredLanguage') || 'en';
        desktopSelector.value = savedLang2;
    }

    // 4. Update text
    updateNavText();
    setTimeout(updateNavText, 100);

    // 4.5. Sync i18n engine with current language
    var currentLang = localStorage.getItem('preferredLanguage') || 'en';
    if (typeof i18n !== 'undefined' && i18n.setLanguage) {
        i18n.setLanguage(currentLang);
    }

    // 5. Load user info
    loadUserInfo();

    // 6. Close user dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-dropdown')) {
            var dropdown = document.getElementById('userDropdown');
            var dropdownMenu = document.getElementById('userMenu');
            if (dropdown) dropdown.classList.remove('open');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        }
    });

    // 7. Mobile navbar collapse/overlay handling
    var navbarCollapse = document.getElementById('navbarNav');
    var navbarOverlay = document.getElementById('navbarOverlay');

    if (navbarCollapse) {
        navbarCollapse.addEventListener('show.bs.collapse', function() {
            if (navbarOverlay) navbarOverlay.classList.add('show');
        });
        navbarCollapse.addEventListener('hide.bs.collapse', function() {
            if (navbarOverlay) navbarOverlay.classList.remove('show');
        });
    }

    if (navbarOverlay) {
        navbarOverlay.addEventListener('click', function() {
            var bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        });
    }

    // 8. Listen for language change events
    document.addEventListener('languageChanged', function() {
        updateNavText();
    });

    // 8.5. Register with i18n engine for reliable language sync
    if (typeof i18n !== 'undefined' && i18n.onLanguageChange) {
        i18n.onLanguageChange(function() {
            updateNavText();
        });
    }

    // 9. Initialize unread message badge
    updateMessageBadge();

    // 10. Delayed navbar text update (ensures i18n has finished loading)
    setTimeout(function() {
        updateNavText();
    }, 500);
});

// ========== Message Badge ==========

/**
 * 未読メッセージ数をバッジに表示
 * localStorageから未読数を取得、またはAPIから取得
 */
function updateMessageBadge() {
    var token = localStorage.getItem('token');
    var apply = function(count) {
        var badges = document.querySelectorAll('.msg-badge');
        for (var i = 0; i < badges.length; i++) {
            if (count > 0) {
                badges[i].textContent = count > 99 ? '99+' : count;
                badges[i].style.display = 'inline-flex';
            } else {
                badges[i].style.display = 'none';
            }
        }
    };
    if (!token) { apply(0); return; }
    // 実APIの未読数を表示: 通知 + DM の合算
    var headers = { 'Authorization': 'Bearer ' + token };
    var getCount = function(url) {
        return fetch((window.API_ORIGIN || '') + url, { headers: headers })
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(data) {
                if (!data) return 0;
                var c = data.count;
                if (c == null) c = data.unread_count;
                if (c == null) c = data.unreadCount;
                if (c == null && data.data) c = data.data.count;
                return parseInt(c, 10) || 0;
            })
            .catch(function() { return 0; });
    };
    Promise.all([
        getCount('/api/notifications/unread-count'),
        getCount('/api/messages/unread-count')
    ]).then(function(counts) { apply(counts[0] + counts[1]); });
}

// Expose globally so pages can trigger updates
window.updateMessageBadge = updateMessageBadge;
