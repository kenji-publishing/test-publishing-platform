/**
 * Publisher Platform - Translations
 * Phase 12-2c: login/register/dashboard翻訳追加
 * 対応言語: en, ja, zh, es, fr, de, ko, ar, pt (9言語)
 */

const translations = {
    // =====================================================
    // English (英語)
    // =====================================================
    en: {
        nav: {
            home: 'Home',
            browse: 'Browse',
            genres: 'Genres',
            revenue: 'Revenue Sharing',
            upload: 'Upload Work',
            dashboard: 'Dashboard',
            register: 'Register',
            login: 'Sign In',
            logout: 'Logout',
            getStarted: 'Get Started',
            author: 'Author',
            translator: 'Translator',
            editor: 'Editor',
            notifications: 'Notifications',
            settings: 'Settings',
            support: 'Support'
        },
        home: {
            hero: {
                title: 'Discover Stories from Around the World',
                subtitle: 'Read and publish stories in 9 languages. Connect with readers and writers globally.',
                startReading: 'Start Reading',
                startWriting: 'Start Writing',
                availableIn: 'Available in 9 languages'
            },
            featured: { title: 'Featured Works', viewAll: 'View All Works' },
            howItWorks: {
                title: 'How It Works',
                step1: { title: 'Write & Upload', desc: 'Create your story in any of our 9 supported languages. Upload your work in just a few clicks.' },
                step2: { title: 'AI Translation', desc: 'Our AI instantly translates your work into 9 languages. Reach readers around the world.' },
                step3: { title: 'Earn Revenue', desc: 'Earn up to 60% of sales revenue. Fair distribution for all creators.' }
            },
            stats: { languages: 'Languages', works: 'Works', authors: 'Authors', readers: 'Readers' },
            forCreators: {
                title: 'For Creators',
                desc: 'Join our community of writers, translators, and artists. Share your stories with the world and earn from your creativity.',
                feature1: 'Free AI translation to 9 languages',
                feature2: 'Earn up to 60% revenue share',
                feature3: 'Reach global audience instantly',
                feature4: 'Keep full rights to your work',
                button: 'Start Creating'
            },
            revenue: { title: 'Revenue Distribution', platform: 'Platform' },
            cta: { title: 'Ready to Start Your Journey?', subtitle: 'Join thousands of readers and creators on Publisher.', createAccount: 'Create Free Account', browseWorks: 'Browse Works' }
        },
        login: {
            welcomeBack: 'Welcome Back',
            subtitle: 'Sign in to continue to your account',
            email: 'Email Address',
            emailPlaceholder: 'Enter your email',
            password: 'Password',
            passwordPlaceholder: 'Enter your password',
            rememberMe: 'Remember me',
            forgotPassword: 'Forgot password?',
            signIn: 'Sign In',
            orContinueWith: 'or continue with',
            noAccount: "Don't have an account?",
            signUpFree: 'Sign up for free'
        },
        register: {
            title: 'Create Your Account',
            subtitle: 'Join thousands of readers and creators worldwide',
            roles: { reader: 'Reader', readerDesc: 'Discover stories', author: 'Author', authorDesc: 'Write & publish', translator: 'Translator', translatorDesc: 'Translate works' },
            firstName: 'First Name',
            firstNamePlaceholder: 'First name',
            lastName: 'Last Name',
            lastNamePlaceholder: 'Last name',
            createPassword: 'Create a password',
            preferredLanguage: 'Preferred Language',
            agreeToTerms: 'I agree to the',
            and: 'and',
            createAccount: 'Create Account',
            orSignUpWith: 'or sign up with',
            haveAccount: 'Already have an account?'
        },
        dashboard: {
            title: 'Dashboard',
            welcome: 'Welcome back',
            overview: 'Overview',
            myWorks: 'My Works',
            earnings: 'Earnings',
            analytics: 'Analytics',
            recentActivity: 'Recent Activity',
            quickActions: 'Quick Actions',
            uploadNew: 'Upload New Work',
            viewAll: 'View All',
            totalRevenue: 'Total Revenue',
            thisMonth: 'This Month',
            totalViews: 'Total Views',
            totalWorks: 'Total Works',
            followers: 'Followers'
        },
        footer: {
            tagline: 'A multilingual publishing platform connecting authors, translators, and readers worldwide.',
            explore: 'Explore', authors: 'Authors', creators: 'Creators', write: 'Write', translate: 'Translate', pricing: 'Pricing', help: 'Help', faq: 'FAQ', legal: 'Legal', terms: 'Terms', privacy: 'Privacy', contact: 'Contact'
        },
        common: { loading: 'Loading...', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', submit: 'Submit', search: 'Search', filter: 'Filter', all: 'All', none: 'None', yes: 'Yes', no: 'No', back: 'Back', next: 'Next', previous: 'Previous', free: 'Free' }
    },

    // =====================================================
    // Japanese (日本語)
    // =====================================================
    ja: {
        nav: { home: 'ホーム', browse: '作品を探す', genres: 'ジャンル', revenue: '収益配分', upload: '作品アップロード', dashboard: 'ダッシュボード', register: '登録', login: 'ログイン', logout: 'ログアウト', getStarted: '今すぐ始める', author: '著者', translator: '翻訳者', editor: '編集者', notifications: '通知', settings: '設定', support: 'サポート' },
        home: {
            hero: { title: '世界中の物語を発見しよう', subtitle: '9言語で物語を読んで出版。世界中の読者と作家とつながる。', startReading: '読み始める', startWriting: '書き始める', availableIn: '9言語に対応' },
            featured: { title: '注目の作品', viewAll: 'すべての作品を見る' },
            howItWorks: { title: '使い方', step1: { title: '書いてアップロード', desc: '9つの対応言語のいずれかで物語を作成。数クリックで作品をアップロード。' }, step2: { title: 'AI翻訳', desc: 'AIが即座に9言語に翻訳。世界中の読者にリーチ。' }, step3: { title: '収益を得る', desc: '売上の最大60%を獲得。すべてのクリエイターに公正な分配。' } },
            stats: { languages: '言語', works: '作品', authors: '著者', readers: '読者' },
            forCreators: { title: 'クリエイターのために', desc: '作家、翻訳者、アーティストのコミュニティに参加。', feature1: '9言語への無料AI翻訳', feature2: '最大60%の収益シェア', feature3: '即座にグローバルな読者にリーチ', feature4: '作品の完全な権利を保持', button: '創作を始める' },
            revenue: { title: '収益配分', platform: 'プラットフォーム' },
            cta: { title: '始める準備はできましたか？', subtitle: 'Publisherで何千人もの読者とクリエイターに参加。', createAccount: '無料アカウント作成', browseWorks: '作品を探す' }
        },
        login: { welcomeBack: 'おかえりなさい', subtitle: 'アカウントにログインして続ける', email: 'メールアドレス', emailPlaceholder: 'メールアドレスを入力', password: 'パスワード', passwordPlaceholder: 'パスワードを入力', rememberMe: 'ログイン状態を保持', forgotPassword: 'パスワードを忘れた場合', signIn: 'ログイン', orContinueWith: 'または以下でログイン', noAccount: 'アカウントをお持ちでないですか？', signUpFree: '無料で登録' },
        register: { title: 'アカウントを作成', subtitle: '世界中の読者とクリエイターに参加', roles: { reader: '読者', readerDesc: '物語を発見', author: '著者', authorDesc: '執筆・出版', translator: '翻訳者', translatorDesc: '作品を翻訳' }, firstName: '名', firstNamePlaceholder: '名', lastName: '姓', lastNamePlaceholder: '姓', createPassword: 'パスワードを作成', preferredLanguage: '優先言語', agreeToTerms: '同意します：', and: 'および', createAccount: 'アカウント作成', orSignUpWith: 'または以下で登録', haveAccount: 'すでにアカウントをお持ちですか？' },
        dashboard: { title: 'ダッシュボード', welcome: 'おかえりなさい', overview: '概要', myWorks: '自分の作品', earnings: '収益', analytics: '分析', recentActivity: '最近のアクティビティ', quickActions: 'クイックアクション', uploadNew: '新しい作品をアップロード', viewAll: 'すべて見る', totalRevenue: '総収益', thisMonth: '今月', totalViews: '総閲覧数', totalWorks: '総作品数', followers: 'フォロワー' },
        footer: { tagline: '著者、翻訳者、読者を世界中でつなぐ多言語出版プラットフォーム。', explore: '探索', authors: '著者', creators: 'クリエイター', write: '執筆', translate: '翻訳', pricing: '料金', help: 'ヘルプ', faq: 'FAQ', legal: '法的情報', terms: '利用規約', privacy: 'プライバシー', contact: 'お問い合わせ' },
        common: { loading: '読み込み中...', save: '保存', cancel: 'キャンセル', delete: '削除', edit: '編集', submit: '送信', search: '検索', filter: 'フィルター', all: 'すべて', none: 'なし', yes: 'はい', no: 'いいえ', back: '戻る', next: '次へ', previous: '前へ', free: '無料' }
    },

    // =====================================================
    // Chinese (中国語)
    // =====================================================
    zh: {
        nav: { home: '首页', browse: '浏览', genres: '类型', revenue: '收益分配', upload: '上传作品', dashboard: '仪表板', register: '注册', login: '登录', logout: '退出', getStarted: '开始使用', author: '作者', translator: '翻译', editor: '编辑', notifications: '通知', settings: '设置', support: '支持' },
        home: {
            hero: { title: '发现来自世界各地的故事', subtitle: '用9种语言阅读和发布故事。与全球读者和作家联系。', startReading: '开始阅读', startWriting: '开始写作', availableIn: '支持9种语言' },
            featured: { title: '精选作品', viewAll: '查看全部作品' },
            howItWorks: { title: '如何使用', step1: { title: '写作和上传', desc: '用我们支持的9种语言之一创作你的故事。' }, step2: { title: 'AI翻译', desc: '我们的AI即时将您的作品翻译成9种语言。' }, step3: { title: '获得收益', desc: '获得高达60%的销售收入。' } },
            stats: { languages: '语言', works: '作品', authors: '作者', readers: '读者' },
            forCreators: { title: '为创作者', desc: '加入我们的作家、翻译者和艺术家社区。', feature1: '免费AI翻译到9种语言', feature2: '获得高达60%的收益分成', feature3: '即时触达全球受众', feature4: '保留作品的完整权利', button: '开始创作' },
            revenue: { title: '收益分配', platform: '平台' },
            cta: { title: '准备开始你的旅程了吗？', subtitle: '加入Publisher上成千上万的读者和创作者。', createAccount: '创建免费账户', browseWorks: '浏览作品' }
        },
        login: { welcomeBack: '欢迎回来', subtitle: '登录以继续访问您的账户', email: '电子邮箱', emailPlaceholder: '输入您的邮箱', password: '密码', passwordPlaceholder: '输入您的密码', rememberMe: '记住我', forgotPassword: '忘记密码？', signIn: '登录', orContinueWith: '或使用以下方式登录', noAccount: '还没有账户？', signUpFree: '免费注册' },
        register: { title: '创建您的账户', subtitle: '加入全球数千名读者和创作者', roles: { reader: '读者', readerDesc: '发现故事', author: '作者', authorDesc: '写作发布', translator: '译者', translatorDesc: '翻译作品' }, firstName: '名', firstNamePlaceholder: '名', lastName: '姓', lastNamePlaceholder: '姓', createPassword: '创建密码', preferredLanguage: '首选语言', agreeToTerms: '我同意', and: '和', createAccount: '创建账户', orSignUpWith: '或使用以下方式注册', haveAccount: '已有账户？' },
        dashboard: { title: '仪表板', welcome: '欢迎回来', overview: '概览', myWorks: '我的作品', earnings: '收益', analytics: '分析', recentActivity: '最近活动', quickActions: '快捷操作', uploadNew: '上传新作品', viewAll: '查看全部', totalRevenue: '总收入', thisMonth: '本月', totalViews: '总浏览量', totalWorks: '总作品数', followers: '粉丝' },
        footer: { tagline: '连接全球作者、翻译者和读者的多语言出版平台。', explore: '探索', authors: '作者', creators: '创作者', write: '写作', translate: '翻译', pricing: '定价', help: '帮助', faq: '常见问题', legal: '法律', terms: '条款', privacy: '隐私', contact: '联系' },
        common: { loading: '加载中...', save: '保存', cancel: '取消', delete: '删除', edit: '编辑', submit: '提交', search: '搜索', filter: '筛选', all: '全部', none: '无', yes: '是', no: '否', back: '返回', next: '下一个', previous: '上一个', free: '免费' }
    },

    // =====================================================
    // Spanish (スペイン語)
    // =====================================================
    es: {
        nav: { home: 'Inicio', browse: 'Explorar', genres: 'Géneros', revenue: 'Distribución de Ingresos', upload: 'Subir Obra', dashboard: 'Panel', register: 'Registrarse', login: 'Iniciar Sesión', logout: 'Cerrar Sesión', getStarted: 'Comenzar', author: 'Autor', translator: 'Traductor', editor: 'Editor', notifications: 'Notificaciones', settings: 'Configuración', support: 'Soporte' },
        home: {
            hero: { title: 'Descubre Historias de Todo el Mundo', subtitle: 'Lee y publica historias en 9 idiomas.', startReading: 'Empezar a Leer', startWriting: 'Empezar a Escribir', availableIn: 'Disponible en 9 idiomas' },
            featured: { title: 'Obras Destacadas', viewAll: 'Ver Todas las Obras' },
            howItWorks: { title: 'Cómo Funciona', step1: { title: 'Escribe y Sube', desc: 'Crea tu historia en cualquiera de nuestros 9 idiomas.' }, step2: { title: 'Traducción IA', desc: 'Nuestra IA traduce instantáneamente tu trabajo a 9 idiomas.' }, step3: { title: 'Gana Ingresos', desc: 'Gana hasta el 60% de los ingresos de ventas.' } },
            stats: { languages: 'Idiomas', works: 'Obras', authors: 'Autores', readers: 'Lectores' },
            forCreators: { title: 'Para Creadores', desc: 'Únete a nuestra comunidad de escritores.', feature1: 'Traducción IA gratuita a 9 idiomas', feature2: 'Gana hasta 60% de participación', feature3: 'Alcanza audiencia global instantáneamente', feature4: 'Mantén todos los derechos de tu obra', button: 'Empezar a Crear' },
            revenue: { title: 'Distribución de Ingresos', platform: 'Plataforma' },
            cta: { title: '¿Listo para Empezar tu Viaje?', subtitle: 'Únete a miles de lectores y creadores.', createAccount: 'Crear Cuenta Gratis', browseWorks: 'Explorar Obras' }
        },
        login: { welcomeBack: 'Bienvenido de Nuevo', subtitle: 'Inicia sesión para continuar', email: 'Correo Electrónico', emailPlaceholder: 'Ingresa tu correo', password: 'Contraseña', passwordPlaceholder: 'Ingresa tu contraseña', rememberMe: 'Recuérdame', forgotPassword: '¿Olvidaste tu contraseña?', signIn: 'Iniciar Sesión', orContinueWith: 'o continúa con', noAccount: '¿No tienes cuenta?', signUpFree: 'Regístrate gratis' },
        register: { title: 'Crea Tu Cuenta', subtitle: 'Únete a miles de lectores y creadores', roles: { reader: 'Lector', readerDesc: 'Descubre historias', author: 'Autor', authorDesc: 'Escribe y publica', translator: 'Traductor', translatorDesc: 'Traduce obras' }, firstName: 'Nombre', firstNamePlaceholder: 'Nombre', lastName: 'Apellido', lastNamePlaceholder: 'Apellido', createPassword: 'Crea una contraseña', preferredLanguage: 'Idioma Preferido', agreeToTerms: 'Acepto los', and: 'y la', createAccount: 'Crear Cuenta', orSignUpWith: 'o regístrate con', haveAccount: '¿Ya tienes cuenta?' },
        dashboard: { title: 'Panel', welcome: 'Bienvenido de nuevo', overview: 'Resumen', myWorks: 'Mis Obras', earnings: 'Ganancias', analytics: 'Análisis', recentActivity: 'Actividad Reciente', quickActions: 'Acciones Rápidas', uploadNew: 'Subir Nueva Obra', viewAll: 'Ver Todo', totalRevenue: 'Ingresos Totales', thisMonth: 'Este Mes', totalViews: 'Vistas Totales', totalWorks: 'Total de Obras', followers: 'Seguidores' },
        footer: { tagline: 'Una plataforma de publicación multilingüe.', explore: 'Explorar', authors: 'Autores', creators: 'Creadores', write: 'Escribir', translate: 'Traducir', pricing: 'Precios', help: 'Ayuda', faq: 'FAQ', legal: 'Legal', terms: 'Términos', privacy: 'Privacidad', contact: 'Contacto' },
        common: { loading: 'Cargando...', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar', submit: 'Enviar', search: 'Buscar', filter: 'Filtrar', all: 'Todo', none: 'Ninguno', yes: 'Sí', no: 'No', back: 'Volver', next: 'Siguiente', previous: 'Anterior', free: 'Gratis' }
    },

    // =====================================================
    // French (フランス語)
    // =====================================================
    fr: {
        nav: { home: 'Accueil', browse: 'Parcourir', genres: 'Genres', revenue: 'Partage des Revenus', upload: 'Télécharger', dashboard: 'Tableau de Bord', register: "S'inscrire", login: 'Connexion', logout: 'Déconnexion', getStarted: 'Commencer', author: 'Auteur', translator: 'Traducteur', editor: 'Éditeur', notifications: 'Notifications', settings: 'Paramètres', support: 'Support' },
        home: {
            hero: { title: 'Découvrez des Histoires du Monde Entier', subtitle: 'Lisez et publiez des histoires en 9 langues.', startReading: 'Commencer à Lire', startWriting: 'Commencer à Écrire', availableIn: 'Disponible en 9 langues' },
            featured: { title: 'Œuvres en Vedette', viewAll: 'Voir Toutes les Œuvres' },
            howItWorks: { title: 'Comment Ça Marche', step1: { title: 'Écrivez et Téléchargez', desc: "Créez votre histoire dans l'une de nos 9 langues." }, step2: { title: 'Traduction IA', desc: 'Notre IA traduit instantanément votre travail en 9 langues.' }, step3: { title: 'Gagnez des Revenus', desc: "Gagnez jusqu'à 60% des revenus de vente." } },
            stats: { languages: 'Langues', works: 'Œuvres', authors: 'Auteurs', readers: 'Lecteurs' },
            forCreators: { title: 'Pour les Créateurs', desc: "Rejoignez notre communauté d'écrivains.", feature1: 'Traduction IA gratuite en 9 langues', feature2: "Gagnez jusqu'à 60% de partage", feature3: 'Atteignez un public mondial instantanément', feature4: 'Gardez tous les droits sur votre travail', button: 'Commencer à Créer' },
            revenue: { title: 'Distribution des Revenus', platform: 'Plateforme' },
            cta: { title: 'Prêt à Commencer Votre Voyage?', subtitle: 'Rejoignez des milliers de lecteurs et créateurs.', createAccount: 'Créer un Compte Gratuit', browseWorks: 'Parcourir les Œuvres' }
        },
        login: { welcomeBack: 'Bon Retour', subtitle: 'Connectez-vous pour continuer', email: 'Adresse Email', emailPlaceholder: 'Entrez votre email', password: 'Mot de Passe', passwordPlaceholder: 'Entrez votre mot de passe', rememberMe: 'Se souvenir de moi', forgotPassword: 'Mot de passe oublié?', signIn: 'Connexion', orContinueWith: 'ou continuez avec', noAccount: "Vous n'avez pas de compte?", signUpFree: 'Inscrivez-vous gratuitement' },
        register: { title: 'Créez Votre Compte', subtitle: 'Rejoignez des milliers de lecteurs et créateurs', roles: { reader: 'Lecteur', readerDesc: 'Découvrez des histoires', author: 'Auteur', authorDesc: 'Écrivez et publiez', translator: 'Traducteur', translatorDesc: 'Traduisez des œuvres' }, firstName: 'Prénom', firstNamePlaceholder: 'Prénom', lastName: 'Nom', lastNamePlaceholder: 'Nom', createPassword: 'Créez un mot de passe', preferredLanguage: 'Langue Préférée', agreeToTerms: "J'accepte les", and: 'et la', createAccount: 'Créer un Compte', orSignUpWith: 'ou inscrivez-vous avec', haveAccount: 'Vous avez déjà un compte?' },
        dashboard: { title: 'Tableau de Bord', welcome: 'Bon retour', overview: 'Aperçu', myWorks: 'Mes Œuvres', earnings: 'Revenus', analytics: 'Analyses', recentActivity: 'Activité Récente', quickActions: 'Actions Rapides', uploadNew: 'Télécharger Nouvelle Œuvre', viewAll: 'Voir Tout', totalRevenue: 'Revenus Totaux', thisMonth: 'Ce Mois', totalViews: 'Vues Totales', totalWorks: "Total d'Œuvres", followers: 'Abonnés' },
        footer: { tagline: 'Une plateforme de publication multilingue.', explore: 'Explorer', authors: 'Auteurs', creators: 'Créateurs', write: 'Écrire', translate: 'Traduire', pricing: 'Tarifs', help: 'Aide', faq: 'FAQ', legal: 'Mentions Légales', terms: 'Conditions', privacy: 'Confidentialité', contact: 'Contact' },
        common: { loading: 'Chargement...', save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', submit: 'Soumettre', search: 'Rechercher', filter: 'Filtrer', all: 'Tout', none: 'Aucun', yes: 'Oui', no: 'Non', back: 'Retour', next: 'Suivant', previous: 'Précédent', free: 'Gratuit' }
    },

    // =====================================================
    // German (ドイツ語)
    // =====================================================
    de: {
        nav: { home: 'Startseite', browse: 'Durchsuchen', genres: 'Genres', revenue: 'Umsatzbeteiligung', upload: 'Hochladen', dashboard: 'Dashboard', register: 'Registrieren', login: 'Anmelden', logout: 'Abmelden', getStarted: 'Loslegen', author: 'Autor', translator: 'Übersetzer', editor: 'Redakteur', notifications: 'Benachrichtigungen', settings: 'Einstellungen', support: 'Support' },
        home: {
            hero: { title: 'Entdecke Geschichten aus aller Welt', subtitle: 'Lesen und veröffentlichen Sie Geschichten in 9 Sprachen.', startReading: 'Lesen starten', startWriting: 'Schreiben starten', availableIn: 'Verfügbar in 9 Sprachen' },
            featured: { title: 'Ausgewählte Werke', viewAll: 'Alle Werke anzeigen' },
            howItWorks: { title: 'So funktioniert es', step1: { title: 'Schreiben & Hochladen', desc: 'Erstellen Sie Ihre Geschichte in einer unserer 9 Sprachen.' }, step2: { title: 'KI-Übersetzung', desc: 'Unsere KI übersetzt Ihr Werk sofort in 9 Sprachen.' }, step3: { title: 'Einnahmen erzielen', desc: 'Verdienen Sie bis zu 60% der Verkaufserlöse.' } },
            stats: { languages: 'Sprachen', works: 'Werke', authors: 'Autoren', readers: 'Leser' },
            forCreators: { title: 'Für Kreative', desc: 'Treten Sie unserer Gemeinschaft bei.', feature1: 'Kostenlose KI-Übersetzung in 9 Sprachen', feature2: 'Bis zu 60% Umsatzbeteiligung', feature3: 'Sofort globales Publikum erreichen', feature4: 'Volle Rechte an Ihrem Werk behalten', button: 'Kreieren starten' },
            revenue: { title: 'Umsatzverteilung', platform: 'Plattform' },
            cta: { title: 'Bereit für Ihre Reise?', subtitle: 'Schließen Sie sich Tausenden an.', createAccount: 'Kostenloses Konto erstellen', browseWorks: 'Werke durchsuchen' }
        },
        login: { welcomeBack: 'Willkommen Zurück', subtitle: 'Melden Sie sich an, um fortzufahren', email: 'E-Mail-Adresse', emailPlaceholder: 'Geben Sie Ihre E-Mail ein', password: 'Passwort', passwordPlaceholder: 'Geben Sie Ihr Passwort ein', rememberMe: 'Angemeldet bleiben', forgotPassword: 'Passwort vergessen?', signIn: 'Anmelden', orContinueWith: 'oder weiter mit', noAccount: 'Noch kein Konto?', signUpFree: 'Kostenlos registrieren' },
        register: { title: 'Erstellen Sie Ihr Konto', subtitle: 'Treten Sie Tausenden bei', roles: { reader: 'Leser', readerDesc: 'Entdecken Sie Geschichten', author: 'Autor', authorDesc: 'Schreiben & veröffentlichen', translator: 'Übersetzer', translatorDesc: 'Werke übersetzen' }, firstName: 'Vorname', firstNamePlaceholder: 'Vorname', lastName: 'Nachname', lastNamePlaceholder: 'Nachname', createPassword: 'Passwort erstellen', preferredLanguage: 'Bevorzugte Sprache', agreeToTerms: 'Ich stimme den', and: 'und der', createAccount: 'Konto erstellen', orSignUpWith: 'oder registrieren mit', haveAccount: 'Haben Sie bereits ein Konto?' },
        dashboard: { title: 'Dashboard', welcome: 'Willkommen zurück', overview: 'Übersicht', myWorks: 'Meine Werke', earnings: 'Einnahmen', analytics: 'Analysen', recentActivity: 'Letzte Aktivität', quickActions: 'Schnellaktionen', uploadNew: 'Neues Werk hochladen', viewAll: 'Alle anzeigen', totalRevenue: 'Gesamteinnahmen', thisMonth: 'Dieser Monat', totalViews: 'Gesamtaufrufe', totalWorks: 'Gesamtwerke', followers: 'Follower' },
        footer: { tagline: 'Eine mehrsprachige Verlagsplattform.', explore: 'Entdecken', authors: 'Autoren', creators: 'Kreative', write: 'Schreiben', translate: 'Übersetzen', pricing: 'Preise', help: 'Hilfe', faq: 'FAQ', legal: 'Rechtliches', terms: 'Bedingungen', privacy: 'Datenschutz', contact: 'Kontakt' },
        common: { loading: 'Laden...', save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten', submit: 'Absenden', search: 'Suchen', filter: 'Filtern', all: 'Alle', none: 'Keine', yes: 'Ja', no: 'Nein', back: 'Zurück', next: 'Weiter', previous: 'Zurück', free: 'Kostenlos' }
    },

    // =====================================================
    // Korean (韓国語)
    // =====================================================
    ko: {
        nav: { home: '홈', browse: '둘러보기', genres: '장르', revenue: '수익 배분', upload: '작품 업로드', dashboard: '대시보드', register: '등록', login: '로그인', logout: '로그아웃', getStarted: '시작하기', author: '저자', translator: '번역가', editor: '편집자', notifications: '알림', settings: '설정', support: '지원' },
        home: {
            hero: { title: '전 세계의 이야기를 발견하세요', subtitle: '9개 언어로 이야기를 읽고 출판하세요.', startReading: '읽기 시작', startWriting: '쓰기 시작', availableIn: '9개 언어 지원' },
            featured: { title: '추천 작품', viewAll: '모든 작품 보기' },
            howItWorks: { title: '사용 방법', step1: { title: '작성 및 업로드', desc: '9개 언어 중 하나로 이야기를 만드세요.' }, step2: { title: 'AI 번역', desc: 'AI가 작품을 9개 언어로 즉시 번역합니다.' }, step3: { title: '수익 창출', desc: '판매 수익의 최대 60%를 획득하세요.' } },
            stats: { languages: '언어', works: '작품', authors: '저자', readers: '독자' },
            forCreators: { title: '창작자를 위해', desc: '작가 커뮤니티에 참여하세요.', feature1: '9개 언어 무료 AI 번역', feature2: '최대 60% 수익 공유', feature3: '즉시 글로벌 독자 도달', feature4: '작품의 모든 권리 유지', button: '창작 시작' },
            revenue: { title: '수익 분배', platform: '플랫폼' },
            cta: { title: '시작할 준비가 되셨나요?', subtitle: '수천 명의 독자와 창작자와 함께하세요.', createAccount: '무료 계정 만들기', browseWorks: '작품 둘러보기' }
        },
        login: { welcomeBack: '다시 오신 것을 환영합니다', subtitle: '계정에 로그인하여 계속하세요', email: '이메일 주소', emailPlaceholder: '이메일을 입력하세요', password: '비밀번호', passwordPlaceholder: '비밀번호를 입력하세요', rememberMe: '로그인 상태 유지', forgotPassword: '비밀번호를 잊으셨나요?', signIn: '로그인', orContinueWith: '또는 다음으로 계속', noAccount: '계정이 없으신가요?', signUpFree: '무료로 가입하기' },
        register: { title: '계정 만들기', subtitle: '수천 명의 독자와 창작자와 함께하세요', roles: { reader: '독자', readerDesc: '이야기 발견', author: '저자', authorDesc: '작성 및 출판', translator: '번역가', translatorDesc: '작품 번역' }, firstName: '이름', firstNamePlaceholder: '이름', lastName: '성', lastNamePlaceholder: '성', createPassword: '비밀번호 만들기', preferredLanguage: '선호 언어', agreeToTerms: '동의합니다:', and: '및', createAccount: '계정 만들기', orSignUpWith: '또는 다음으로 가입', haveAccount: '이미 계정이 있으신가요?' },
        dashboard: { title: '대시보드', welcome: '다시 오신 것을 환영합니다', overview: '개요', myWorks: '내 작품', earnings: '수익', analytics: '분석', recentActivity: '최근 활동', quickActions: '빠른 작업', uploadNew: '새 작품 업로드', viewAll: '전체 보기', totalRevenue: '총 수익', thisMonth: '이번 달', totalViews: '총 조회수', totalWorks: '총 작품 수', followers: '팔로워' },
        footer: { tagline: '전 세계 저자, 번역가, 독자를 연결하는 다국어 출판 플랫폼.', explore: '탐색', authors: '저자', creators: '창작자', write: '쓰기', translate: '번역', pricing: '가격', help: '도움말', faq: 'FAQ', legal: '법적 정보', terms: '이용약관', privacy: '개인정보', contact: '연락처' },
        common: { loading: '로딩 중...', save: '저장', cancel: '취소', delete: '삭제', edit: '편집', submit: '제출', search: '검색', filter: '필터', all: '전체', none: '없음', yes: '예', no: '아니오', back: '뒤로', next: '다음', previous: '이전', free: '무료' }
    },

    // =====================================================
    // Arabic (アラビア語)
    // =====================================================
    ar: {
        nav: { home: 'الرئيسية', browse: 'تصفح', genres: 'الأنواع', revenue: 'توزيع الإيرادات', upload: 'رفع عمل', dashboard: 'لوحة التحكم', register: 'تسجيل', login: 'تسجيل الدخول', logout: 'تسجيل الخروج', getStarted: 'ابدأ الآن', author: 'مؤلف', translator: 'مترجم', editor: 'محرر', notifications: 'إشعارات', settings: 'إعدادات', support: 'دعم' },
        home: {
            hero: { title: 'اكتشف قصصًا من جميع أنحاء العالم', subtitle: 'اقرأ وانشر القصص بـ 9 لغات.', startReading: 'ابدأ القراءة', startWriting: 'ابدأ الكتابة', availableIn: 'متاح بـ 9 لغات' },
            featured: { title: 'أعمال مميزة', viewAll: 'عرض جميع الأعمال' },
            howItWorks: { title: 'كيف يعمل', step1: { title: 'اكتب وارفع', desc: 'أنشئ قصتك بأي من لغاتنا التسع.' }, step2: { title: 'ترجمة AI', desc: 'يترجم AI عملك فوريًا إلى 9 لغات.' }, step3: { title: 'اكسب الإيرادات', desc: 'اكسب حتى 60٪ من إيرادات المبيعات.' } },
            stats: { languages: 'لغات', works: 'أعمال', authors: 'مؤلفون', readers: 'قراء' },
            forCreators: { title: 'للمبدعين', desc: 'انضم إلى مجتمعنا من الكتاب.', feature1: 'ترجمة AI مجانية لـ 9 لغات', feature2: 'اكسب حتى 60٪ من الإيرادات', feature3: 'وصول فوري للجمهور العالمي', feature4: 'احتفظ بجميع حقوق عملك', button: 'ابدأ الإبداع' },
            revenue: { title: 'توزيع الإيرادات', platform: 'المنصة' },
            cta: { title: 'مستعد لبدء رحلتك؟', subtitle: 'انضم إلى آلاف القراء والمبدعين.', createAccount: 'إنشاء حساب مجاني', browseWorks: 'تصفح الأعمال' }
        },
        login: { welcomeBack: 'مرحباً بعودتك', subtitle: 'سجل الدخول للمتابعة', email: 'البريد الإلكتروني', emailPlaceholder: 'أدخل بريدك الإلكتروني', password: 'كلمة المرور', passwordPlaceholder: 'أدخل كلمة المرور', rememberMe: 'تذكرني', forgotPassword: 'نسيت كلمة المرور؟', signIn: 'تسجيل الدخول', orContinueWith: 'أو تابع باستخدام', noAccount: 'ليس لديك حساب؟', signUpFree: 'سجل مجاناً' },
        register: { title: 'أنشئ حسابك', subtitle: 'انضم إلى آلاف القراء والمبدعين', roles: { reader: 'قارئ', readerDesc: 'اكتشف القصص', author: 'مؤلف', authorDesc: 'اكتب وانشر', translator: 'مترجم', translatorDesc: 'ترجم الأعمال' }, firstName: 'الاسم الأول', firstNamePlaceholder: 'الاسم الأول', lastName: 'اسم العائلة', lastNamePlaceholder: 'اسم العائلة', createPassword: 'أنشئ كلمة مرور', preferredLanguage: 'اللغة المفضلة', agreeToTerms: 'أوافق على', and: 'و', createAccount: 'إنشاء حساب', orSignUpWith: 'أو سجل باستخدام', haveAccount: 'لديك حساب بالفعل؟' },
        dashboard: { title: 'لوحة التحكم', welcome: 'مرحباً بعودتك', overview: 'نظرة عامة', myWorks: 'أعمالي', earnings: 'الأرباح', analytics: 'التحليلات', recentActivity: 'النشاط الأخير', quickActions: 'إجراءات سريعة', uploadNew: 'رفع عمل جديد', viewAll: 'عرض الكل', totalRevenue: 'إجمالي الإيرادات', thisMonth: 'هذا الشهر', totalViews: 'إجمالي المشاهدات', totalWorks: 'إجمالي الأعمال', followers: 'المتابعون' },
        footer: { tagline: 'منصة نشر متعددة اللغات تربط المؤلفين والمترجمين والقراء.', explore: 'استكشف', authors: 'المؤلفون', creators: 'المبدعون', write: 'اكتب', translate: 'ترجم', pricing: 'الأسعار', help: 'مساعدة', faq: 'الأسئلة الشائعة', legal: 'قانوني', terms: 'الشروط', privacy: 'الخصوصية', contact: 'اتصل' },
        common: { loading: 'جاري التحميل...', save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', submit: 'إرسال', search: 'بحث', filter: 'تصفية', all: 'الكل', none: 'لا شيء', yes: 'نعم', no: 'لا', back: 'رجوع', next: 'التالي', previous: 'السابق', free: 'مجاني' }
    },

    // =====================================================
    // Portuguese (ポルトガル語)
    // =====================================================
    pt: {
        nav: { home: 'Início', browse: 'Explorar', genres: 'Gêneros', revenue: 'Divisão de Receita', upload: 'Enviar Obra', dashboard: 'Painel', register: 'Registrar', login: 'Entrar', logout: 'Sair', getStarted: 'Começar', author: 'Autor', translator: 'Tradutor', editor: 'Editor', notifications: 'Notificações', settings: 'Configurações', support: 'Suporte' },
        home: {
            hero: { title: 'Descubra Histórias de Todo o Mundo', subtitle: 'Leia e publique histórias em 9 idiomas.', startReading: 'Começar a Ler', startWriting: 'Começar a Escrever', availableIn: 'Disponível em 9 idiomas' },
            featured: { title: 'Obras em Destaque', viewAll: 'Ver Todas as Obras' },
            howItWorks: { title: 'Como Funciona', step1: { title: 'Escreva e Envie', desc: 'Crie sua história em qualquer um dos nossos 9 idiomas.' }, step2: { title: 'Tradução IA', desc: 'Nossa IA traduz instantaneamente seu trabalho para 9 idiomas.' }, step3: { title: 'Ganhe Receita', desc: 'Ganhe até 60% da receita de vendas.' } },
            stats: { languages: 'Idiomas', works: 'Obras', authors: 'Autores', readers: 'Leitores' },
            forCreators: { title: 'Para Criadores', desc: 'Junte-se à nossa comunidade de escritores.', feature1: 'Tradução IA gratuita para 9 idiomas', feature2: 'Ganhe até 60% de participação', feature3: 'Alcance público global instantaneamente', feature4: 'Mantenha todos os direitos da sua obra', button: 'Começar a Criar' },
            revenue: { title: 'Distribuição de Receita', platform: 'Plataforma' },
            cta: { title: 'Pronto para Começar sua Jornada?', subtitle: 'Junte-se a milhares de leitores e criadores.', createAccount: 'Criar Conta Grátis', browseWorks: 'Explorar Obras' }
        },
        login: { welcomeBack: 'Bem-vindo de Volta', subtitle: 'Faça login para continuar', email: 'Endereço de Email', emailPlaceholder: 'Digite seu email', password: 'Senha', passwordPlaceholder: 'Digite sua senha', rememberMe: 'Lembrar de mim', forgotPassword: 'Esqueceu a senha?', signIn: 'Entrar', orContinueWith: 'ou continue com', noAccount: 'Não tem uma conta?', signUpFree: 'Cadastre-se grátis' },
        register: { title: 'Crie Sua Conta', subtitle: 'Junte-se a milhares de leitores e criadores', roles: { reader: 'Leitor', readerDesc: 'Descubra histórias', author: 'Autor', authorDesc: 'Escreva e publique', translator: 'Tradutor', translatorDesc: 'Traduza obras' }, firstName: 'Nome', firstNamePlaceholder: 'Nome', lastName: 'Sobrenome', lastNamePlaceholder: 'Sobrenome', createPassword: 'Crie uma senha', preferredLanguage: 'Idioma Preferido', agreeToTerms: 'Eu concordo com os', and: 'e a', createAccount: 'Criar Conta', orSignUpWith: 'ou cadastre-se com', haveAccount: 'Já tem uma conta?' },
        dashboard: { title: 'Painel', welcome: 'Bem-vindo de volta', overview: 'Visão Geral', myWorks: 'Minhas Obras', earnings: 'Ganhos', analytics: 'Análises', recentActivity: 'Atividade Recente', quickActions: 'Ações Rápidas', uploadNew: 'Enviar Nova Obra', viewAll: 'Ver Tudo', totalRevenue: 'Receita Total', thisMonth: 'Este Mês', totalViews: 'Visualizações Totais', totalWorks: 'Total de Obras', followers: 'Seguidores' },
        footer: { tagline: 'Uma plataforma de publicação multilíngue conectando autores, tradutores e leitores.', explore: 'Explorar', authors: 'Autores', creators: 'Criadores', write: 'Escrever', translate: 'Traduzir', pricing: 'Preços', help: 'Ajuda', faq: 'FAQ', legal: 'Legal', terms: 'Termos', privacy: 'Privacidade', contact: 'Contato' },
        common: { loading: 'Carregando...', save: 'Salvar', cancel: 'Cancelar', delete: 'Excluir', edit: 'Editar', submit: 'Enviar', search: 'Buscar', filter: 'Filtrar', all: 'Todos', none: 'Nenhum', yes: 'Sim', no: 'Não', back: 'Voltar', next: 'Próximo', previous: 'Anterior', free: 'Grátis' }
    }
};

// 言語コード一覧
const availableLanguages = {
    en: { name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
    ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
    zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
    es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
    fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
    ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
    ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
    pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false }
};

// ヘルパー関数
function t(key, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    const keys = key.split('.');
    let result = translations[currentLang];
    for (const k of keys) {
        if (result && result[k]) { result = result[k]; }
        else {
            result = translations.en;
            for (const fallbackKey of keys) {
                if (result && result[fallbackKey]) { result = result[fallbackKey]; }
                else { return key; }
            }
            break;
        }
    }
    return typeof result === 'string' ? result : key;
}

function getCurrentLanguage() {
    return localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0] || 'en';
}

function setLanguage(lang) {
    if (availableLanguages[lang]) {
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.dir = availableLanguages[lang].rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
}

function isLanguageAvailable(lang) { return !!availableLanguages[lang]; }

// グローバルに公開
window.translations = translations;
window.availableLanguages = availableLanguages;
window.t = t;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;
window.isLanguageAvailable = isLanguageAvailable;
