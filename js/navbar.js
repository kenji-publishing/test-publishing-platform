/**
 * Publisher Platform - Navbar JavaScript (Pattern C)
 *
 * 全ページ共通の Navbar 機能。
 * 各HTMLの </body> 直前、Bootstrap の後に読み込む:
 *   <script src="[PATH]js/navbar.js"></script>
 *
 * 提供するグローバル関数:
 *   getCurrentLanguage() - 現在の言語コードを返す
 *   getL(obj) - 多言語オブジェクトから現在の言語の値を返す
 *   toggleUserDropdown(e) - ユーザードロップダウンの開閉
 *   handleLogout() - ログアウト処理
 *   loadUserInfo() - ユーザー情報の読込と表示
 *   updateNavText() - Navbar の多言語テキスト更新
 */

// ========== 多言語対応テキスト（Navbar用・9言語）==========
var navText = {
    translationTools: {
        en: 'Translation Tools', ja: '翻訳ツール', zh: '翻译工具',
        es: 'Herramientas de traducción', fr: 'Outils de traduction', de: 'Übersetzungstools',
        ko: '번역 도구', ar: 'أدوات الترجمة', pt: 'Ferramentas de tradução'
    },
    mangaTranslator: {
        en: 'Manga Translator', ja: 'マンガ翻訳', zh: '漫画翻译',
        es: 'Traductor de Manga', fr: 'Traducteur de Manga', de: 'Manga-Übersetzer',
        ko: '만화 번역기', ar: 'مترجم المانجا', pt: 'Tradutor de Mangá'
    },
    translationStatus: {
        en: 'Translation Status', ja: '翻訳状況', zh: '翻译状态',
        es: 'Estado de traducción', fr: 'Statut de traduction', de: 'Übersetzungsstatus',
        ko: '번역 상태', ar: 'حالة الترجمة', pt: 'Status da tradução'
    },
    findTranslators: {
        en: 'Find Translators', ja: '翻訳者を探す', zh: '寻找翻译',
        es: 'Buscar traductores', fr: 'Trouver des traducteurs', de: 'Übersetzer finden',
        ko: '번역가 찾기', ar: 'البحث عن مترجمين', pt: 'Encontrar tradutores'
    },
    contact: {
        en: 'Contact', ja: 'お問い合わせ', zh: '联系我们',
        es: 'Contacto', fr: 'Contact', de: 'Kontakt',
        ko: '문의', ar: 'اتصل بنا', pt: 'Contato'
    },
    library: {
        en: 'Library', ja: 'ライブラリ', zh: '书库',
        es: 'Biblioteca', fr: 'Bibliothèque', de: 'Bibliothek',
        ko: '라이브러리', ar: 'المكتبة', pt: 'Biblioteca'
    },
    dashboard: {
        en: 'Dashboard', ja: 'ダッシュボード', zh: '控制台',
        es: 'Panel', fr: 'Tableau de bord', de: 'Dashboard',
        ko: '대시보드', ar: 'لوحة التحكم', pt: 'Painel'
    },
    accountSettings: {
        en: 'Account Settings', ja: 'アカウント設定', zh: '账户设置',
        es: 'Configuración de cuenta', fr: 'Paramètres du compte', de: 'Kontoeinstellungen',
        ko: '계정 설정', ar: 'إعدادات الحساب', pt: 'Configurações da conta'
    },
    logout: {
        en: 'Log Out', ja: 'ログアウト', zh: '退出登录',
        es: 'Cerrar sesión', fr: 'Déconnexion', de: 'Abmelden',
        ko: '로그아웃', ar: 'تسجيل الخروج', pt: 'Sair'
    },
    logOutConfirm: {
        en: 'Are you sure you want to log out?', ja: 'ログアウトしますか？', zh: '确定要退出登录吗？',
        es: '¿Estás seguro de que quieres cerrar sesión?', fr: 'Êtes-vous sûr de vouloir vous déconnecter?', de: 'Sind Sie sicher, dass Sie sich abmelden möchten?',
        ko: '로그아웃 하시겠습니까?', ar: 'هل أنت متأكد أنك تريد تسجيل الخروج؟', pt: 'Tem certeza que deseja sair?'
    }
};

function getCurrentLanguage() {
    return localStorage.getItem('preferredLanguage') || 'en';
}
var getCurrentLang = getCurrentLanguage;

function getL(obj) {
    if (!obj) return '';
    var lang = getCurrentLanguage();
    return obj[lang] || obj.en || '';
}

function updateNavText() {
    var menuDashboard = document.getElementById('menuDashboard');
    var menuAccountSettings = document.getElementById('menuAccountSettings');
    var menuLogout = document.getElementById('menuLogout');
    if (menuDashboard) menuDashboard.textContent = getL(navText.dashboard);
    if (menuAccountSettings) menuAccountSettings.textContent = getL(navText.accountSettings);
    if (menuLogout) menuLogout.textContent = getL(navText.logout);

    var els = {
        navLibraryPC: navText.library, navDashboardPC: navText.dashboard,
        navTranslationToolsPC: navText.translationTools, navMangaTranslatorPC: navText.mangaTranslator,
        navTranslationStatusPC: navText.translationStatus, navFindTranslatorsPC: navText.findTranslators,
        navContactPC: navText.contact, navLibraryMobile: navText.library, navDashboardMobile: navText.dashboard,
        navTranslationToolsMobile: navText.translationTools, navMangaTranslatorMobile: navText.mangaTranslator,
        navTranslationStatusMobile: navText.translationStatus, navFindTranslatorsMobile: navText.findTranslators,
        navContactMobile: navText.contact
    };
    Object.keys(els).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = getL(els[id]);
    });
}

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

// ========== DOMContentLoaded: Navbar 初期化 ==========
document.addEventListener('DOMContentLoaded', function() {
    var desktopSelector = document.getElementById('languageSelector');
    var mobileSelector = document.getElementById('languageSelectorMobile');

    if (desktopSelector && mobileSelector) {
        var savedLang = localStorage.getItem('preferredLanguage') || 'en';
        desktopSelector.value = savedLang;
        mobileSelector.value = savedLang;

        mobileSelector.addEventListener('change', function() {
            desktopSelector.value = this.value;
            if (typeof changeLanguage === 'function') changeLanguage(this.value);
            updateNavText();
        });

        desktopSelector.addEventListener('change', function() {
            mobileSelector.value = this.value;
            if (typeof changeLanguage === 'function') changeLanguage(this.value);
            updateNavText();
        });
    } else if (desktopSelector) {
        var savedLang2 = localStorage.getItem('preferredLanguage') || 'en';
        desktopSelector.value = savedLang2;
    }

    updateNavText();
    setTimeout(updateNavText, 100);
    loadUserInfo();

    // Close user dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-dropdown')) {
            var dropdown = document.getElementById('userDropdown');
            var dropdownMenu = document.getElementById('userMenu');
            if (dropdown) dropdown.classList.remove('open');
            if (dropdownMenu) dropdownMenu.classList.remove('show');
        }
    });

    // Mobile navbar collapse/overlay handling
    var navbarCollapse = document.getElementById('navbarNav');
    var navbarOverlay = document.getElementById('navbarOverlay');

    if (navbarCollapse) {
        navbarCollapse.addEventListener('show.bs.collapse', function() {
            document.body.classList.add('menu-open');
            if (navbarOverlay) navbarOverlay.classList.add('show');
        });
        navbarCollapse.addEventListener('hide.bs.collapse', function() {
            document.body.classList.remove('menu-open');
            if (navbarOverlay) navbarOverlay.classList.remove('show');
        });
    }

    if (navbarOverlay) {
        navbarOverlay.addEventListener('click', function() {
            var bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) bsCollapse.hide();
        });
    }

    // Listen for language change events from language-switcher.js
    document.addEventListener('languageChanged', function() {
        updateNavText();
    });
});
