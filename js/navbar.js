/**
 * Publisher Platform - Navbar JavaScript (Pattern C)
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
    { value: 'zh', label: '\ud83c\udde8\ud83c\uddf3 \u4e2d\u6587' },
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
    return obj[lang] || obj.en || '';
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
    var supportPages = ['faq', 'troubleshoot', 'support', 'contact', 'tickets'];
    var supportActive = supportPages.indexOf(activePage) !== -1;

    var html = '';

    // Overlay
    html += '<div class="navbar-overlay d-lg-none" id="navbarOverlay"></div>';

    // Nav start
    html += '<nav class="navbar navbar-expand-lg navbar-custom sticky-top">';
    html += '<div class="container">';

    // Brand
    html += '<a class="navbar-brand" href="' + indexLink + '">';
    html += '<i class="fas fa-book-open"></i> Publisher';
    html += '</a>';

    // Mobile language selector
    html += '<div class="navbar-lang-selector d-lg-none">';
    html += '<select class="language-selector" id="languageSelectorMobile">';
    html += langOpts;
    html += '</select>';
    html += '</div>';

    // User dropdown (auth-only)
    html += '<div class="user-dropdown auth-only" id="userDropdown">';
    html += '<button type="button" class="user-dropdown-toggle" id="userDropdownBtn" onclick="toggleUserDropdown(event)">';
    html += '<i class="fas fa-user-circle"></i>';
    html += '<span class="user-name d-none d-lg-inline" id="userName">User</span>';
    html += '<i class="fas fa-chevron-down user-chevron d-none d-lg-inline"></i>';
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
    html += '<a href="' + p('account-settings.html') + '" class="user-menu-item">';
    html += '<i class="fas fa-cog"></i> <span id="menuAccountSettings">Account Settings</span></a>';
    html += '<div class="user-menu-divider"></div>';
    html += '<button class="user-menu-item logout-btn" onclick="handleLogout()">';
    html += '<i class="fas fa-sign-out-alt"></i> <span id="menuLogout">Log Out</span></button>';
    html += '</div></div>';

    // Hamburger
    html += '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">';
    html += '<span class="navbar-toggler-icon"></span>';
    html += '</button>';

    // Collapse start
    html += '<div class="collapse navbar-collapse" id="navbarNav">';

    // ===== PC Navigation =====
    html += '<ul class="navbar-nav me-auto d-none d-lg-flex">';

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

    // Tools dropdown (auth)
    html += '<li class="nav-item dropdown auth-only">';
    html += '<a class="nav-link dropdown-toggle' + (toolsActive ? ' active' : '') + '" href="#" role="button" data-bs-toggle="dropdown">';
    html += '<i class="fas fa-toolbox me-1"></i> <span id="navToolsPC">' + getL(navText.tools) + '</span></a>';
    html += '<ul class="dropdown-menu">';
    html += '<li><a class="dropdown-item" href="' + p('upload.html') + '"><i class="fas fa-upload me-2"></i><span id="navUploadPC">' + getL(navText.uploadWork) + '</span></a></li>';
    html += '<li><hr class="dropdown-divider"></li>';
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
    html += '<li><a class="dropdown-item" href="' + p('support/faq.html') + '"><i class="fas fa-question-circle me-2"></i><span id="navFaqPC">' + getL(navText.faq) + '</span></a></li>';
    html += '<li><a class="dropdown-item" href="' + p('support/troubleshoot.html') + '"><i class="fas fa-tools me-2"></i><span id="navTroubleshootPC">' + getL(navText.troubleshooting) + '</span></a></li>';
    html += '</ul></li>';

    // Messages (auth) with unread badge
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link' + ac('messages') + ' position-relative" href="' + p('messages.html') + '">';
    html += '<i class="fas fa-envelope me-1"></i> <span id="navMessagesPC">' + getL(navText.messages) + '</span>';
    html += '<span class="msg-badge" id="msgBadgePC" style="display:none;"></span>';
    html += '</a></li>';

    html += '</ul>';

    // ===== Mobile Navigation =====
    html += '<ul class="navbar-nav d-lg-none">';

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

    // Tools collapsible (auth)
    html += '<li class="nav-item auth-only">';
    html += '<a class="nav-link" data-bs-toggle="collapse" href="#translationToolsMenu" role="button">';
    html += '<i class="fas fa-toolbox me-2"></i> <span id="navToolsMobile">' + getL(navText.tools) + '</span>';
    html += '<i class="fas fa-chevron-down ms-auto small"></i></a>';
    html += '<div class="collapse ps-4" id="translationToolsMenu">';
    html += '<a class="nav-link" href="' + p('upload.html') + '"><i class="fas fa-upload me-2"></i> <span id="navUploadMobile">' + getL(navText.uploadWork) + '</span></a>';
    html += '<hr class="dropdown-divider my-1">';
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
    html += '<a class="nav-link' + ac('faq') + '" href="' + p('support/faq.html') + '">';
    html += '<i class="fas fa-question-circle me-2"></i><span id="navFaqMobile">' + getL(navText.faq) + '</span></a></li>';

    html += '<li class="nav-item">';
    html += '<a class="nav-link' + ac('troubleshoot') + '" href="' + p('support/troubleshoot.html') + '">';
    html += '<i class="fas fa-tools me-2"></i><span id="navTroubleshootMobile">' + getL(navText.troubleshooting) + '</span></a></li>';

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
    html += '<div class="d-none d-lg-flex align-items-center gap-3">';

    // Language selector PC
    html += '<select class="language-selector" id="languageSelector">';
    html += langOpts;
    html += '</select>';

    // Guest buttons (PC)
    html += '<div class="navbar-buttons-guest guest-only d-none d-lg-flex">';
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
    html += '<p class="small mb-0" id="footerCopyright">&copy; 2025 Publisher. ' + getL(navText.allRights) + '</p>';
    html += '<div class="d-flex gap-3">';
    html += '<a href="' + p('support/faq.html') + '" class="text-secondary" id="footerHelp">' + getL(navText.help) + '</a>';
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

    // All nav elements (PC + Mobile)
    var els = {
        navBrowsePC: navText.browse,
        navLibraryPC: navText.library,
        navDashboardPC: navText.dashboard,
        navToolsPC: navText.tools,
        navUploadPC: navText.uploadWork,
        navMangaTranslatorPC: navText.mangaTranslator,
        navMangaEditorPC: navText.mangaEditor,
        navNovelTranslatorPC: navText.novelTranslator,
        navAiEditorPC: navText.aiEditor,
        navTranslationStatusPC: navText.translationStatus,
        navFindTranslatorsPC: navText.findTranslators,
        navFindEditorsPC: navText.findEditors,
        navSupportPC: navText.support,
        navFaqPC: navText.faq,
        navTroubleshootPC: navText.troubleshooting,
        navMessagesPC: navText.messages,
        navSignInPC: navText.signIn,
        navGetStartedPC: navText.getStarted,
        navBrowseMobile: navText.browse,
        navLibraryMobile: navText.library,
        navDashboardMobile: navText.dashboard,
        navToolsMobile: navText.tools,
        navUploadMobile: navText.uploadWork,
        navMangaTranslatorMobile: navText.mangaTranslator,
        navMangaEditorMobile: navText.mangaEditor,
        navNovelTranslatorMobile: navText.novelTranslator,
        navAiEditorMobile: navText.aiEditor,
        navTranslationStatusMobile: navText.translationStatus,
        navFindTranslatorsMobile: navText.findTranslators,
        navFindEditorsMobile: navText.findEditors,
        navFaqMobile: navText.faq,
        navTroubleshootMobile: navText.troubleshooting,
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
    if (footerCopyright) footerCopyright.innerHTML = '&copy; 2025 Publisher. ' + getL(navText.allRights);

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
        window.location.reload();
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

// ========== DOMContentLoaded: Auto-initialization ==========
document.addEventListener('DOMContentLoaded', function() {

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
    var count = _getUnreadCount();
    var badges = document.querySelectorAll('.msg-badge');
    for (var i = 0; i < badges.length; i++) {
        if (count > 0) {
            badges[i].textContent = count > 99 ? '99+' : count;
            badges[i].style.display = 'inline-flex';
        } else {
            badges[i].style.display = 'none';
        }
    }
}

function _getUnreadCount() {
    // Method 1: Check API (when backend is connected)
    // For now, use localStorage-based count

    var token = localStorage.getItem('token');
    var user = localStorage.getItem('user');
    if (!token && !user) return 0; // Not logged in

    // Count unread conversations
    var convCount = 0;
    try {
        var storedCount = localStorage.getItem('publisher_unread_conversations');
        if (storedCount !== null) {
            convCount = parseInt(storedCount, 10) || 0;
        } else {
            // First visit: check publisher_messages for demo data
            var msgs = localStorage.getItem('publisher_messages');
            if (msgs) {
                var convs = JSON.parse(msgs);
                for (var i = 0; i < convs.length; i++) {
                    if (convs[i].unread && convs[i].unread > 0) convCount += convs[i].unread;
                }
                localStorage.setItem('publisher_unread_conversations', String(convCount));
            } else {
                // Demo default: 3 unread messages (Sarah 2 + Yuki 1)
                convCount = 3;
                localStorage.setItem('publisher_unread_conversations', '3');
            }
        }
    } catch(e) {}

    // Count unread notifications
    var notifCount = 0;
    try {
        var notifs = JSON.parse(localStorage.getItem('publisher_msg_notifs') || '[]');
        if (notifs.length > 0) {
            for (var j = 0; j < notifs.length; j++) {
                if (!notifs[j].is_read) notifCount++;
            }
        } else {
            // Demo default: 4 unread notifications
            notifCount = 4;
        }
    } catch(e) {}

    return convCount + notifCount;
}

// Expose globally so pages can trigger updates
window.updateMessageBadge = updateMessageBadge;
