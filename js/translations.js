/**
 * Publisher Platform - Translations
 * Phase 12-1: 9言語対応
 * 
 * 対応言語:
 * - en: English (英語)
 * - ja: Japanese (日本語)
 * - zh: Chinese (中国語)
 * - es: Spanish (スペイン語)
 * - fr: French (フランス語)
 * - de: German (ドイツ語)
 * - ko: Korean (韓国語)
 * - ar: Arabic (アラビア語)
 * - pt: Portuguese (ポルトガル語) ← 新規追加
 */

const translations = {
    // =====================================================
    // English (英語)
    // =====================================================
    en: {
        nav: {
            revenue: 'Revenue Sharing',
            upload: 'Upload Work',
            dashboard: 'Dashboard',
            register: 'Register',
            login: 'Login',
            logout: 'Logout',
            author: 'Author',
            translator: 'Translator',
            editor: 'Editor',
            notifications: 'Notifications',
            settings: 'Settings',
            support: 'Support'
        },
        hero: {
            title: 'Publish Your Story to the World',
            subtitle: 'A revolutionary platform connecting authors, translators, and readers across 9 languages. Fair revenue sharing. AI-powered translation. Global reach.',
            start: 'Start Publishing',
            learn: 'Learn More'
        },
        features: {
            title: 'Why Choose Publisher?',
            revenue: {
                title: 'Fair Revenue Sharing',
                desc: 'Authors earn up to 70% when handling translation and editing. Transparent payment system.'
            },
            translation: {
                title: 'AI Translation',
                desc: 'Free AI translation to reach global audiences. Professional human translation available.'
            },
            global: {
                title: 'Global Reach',
                desc: 'Publish in 9 languages: English, Japanese, Chinese, Spanish, French, German, Korean, Arabic, Portuguese.'
            }
        },
        manga: {
            title: 'Manga to the World',
            desc: 'We specialize in bringing Japanese manga and comics to international audiences. Our platform supports vertical and horizontal reading formats, with built-in manga viewer.',
            feature1: 'Professional manga viewer',
            feature2: 'Support for Japanese to multiple languages',
            feature3: 'Rights management system'
        },
        cta: {
            title: 'Ready to Share Your Story?',
            subtitle: 'Join thousands of creators reaching global audiences',
            button: 'Get Started Today'
        },
        footer: {
            tagline: 'Connecting creators and readers worldwide',
            links: 'Quick Links',
            about: 'About',
            terms: 'Terms',
            privacy: 'Privacy',
            contact: 'Contact'
        },
        common: {
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            submit: 'Submit',
            search: 'Search',
            filter: 'Filter',
            all: 'All',
            none: 'None',
            yes: 'Yes',
            no: 'No',
            back: 'Back',
            next: 'Next',
            previous: 'Previous'
        }
    },

    // =====================================================
    // Japanese (日本語)
    // =====================================================
    ja: {
        nav: {
            revenue: '収益配分',
            upload: '作品アップロード',
            dashboard: 'ダッシュボード',
            register: '登録',
            login: 'ログイン',
            logout: 'ログアウト',
            author: '著者',
            translator: '翻訳者',
            editor: '編集者',
            notifications: '通知',
            settings: '設定',
            support: 'サポート'
        },
        hero: {
            title: 'あなたの物語を世界へ',
            subtitle: '9言語で著者、翻訳者、読者をつなぐ革新的なプラットフォーム。公正な収益配分。AI翻訳機能。グローバルな展開。',
            start: '出版を始める',
            learn: '詳しく見る'
        },
        features: {
            title: 'Publisherを選ぶ理由',
            revenue: {
                title: '公正な収益配分',
                desc: '著者は翻訳・編集を担当すると最大70%を獲得。透明な支払いシステム。'
            },
            translation: {
                title: 'AI翻訳',
                desc: '無料のAI翻訳で世界中の読者へリーチ。プロの人間翻訳も利用可能。'
            },
            global: {
                title: 'グローバルな展開',
                desc: '9言語で出版：英語、日本語、中国語、スペイン語、フランス語、ドイツ語、韓国語、アラビア語、ポルトガル語。'
            }
        },
        manga: {
            title: 'マンガを世界へ',
            desc: '日本のマンガやコミックを世界の読者に届けることに特化しています。縦読み・横読みの両方に対応したマンガビューアを搭載。',
            feature1: 'プロフェッショナルなマンガビューア',
            feature2: '日本語から多言語へのサポート',
            feature3: '権利管理システム'
        },
        cta: {
            title: 'あなたの物語を共有する準備はできましたか？',
            subtitle: '世界中の読者にリーチする数千人のクリエイターに参加',
            button: '今すぐ始める'
        },
        footer: {
            tagline: '世界中のクリエイターと読者をつなぐ',
            links: 'クイックリンク',
            about: '概要',
            terms: '利用規約',
            privacy: 'プライバシー',
            contact: 'お問い合わせ'
        },
        common: {
            loading: '読み込み中...',
            save: '保存',
            cancel: 'キャンセル',
            delete: '削除',
            edit: '編集',
            submit: '送信',
            search: '検索',
            filter: 'フィルター',
            all: 'すべて',
            none: 'なし',
            yes: 'はい',
            no: 'いいえ',
            back: '戻る',
            next: '次へ',
            previous: '前へ'
        }
    },

    // =====================================================
    // Chinese (中国語)
    // =====================================================
    zh: {
        nav: {
            revenue: '收益分配',
            upload: '上传作品',
            dashboard: '仪表板',
            register: '注册',
            login: '登录',
            logout: '退出',
            author: '作者',
            translator: '翻译',
            editor: '编辑',
            notifications: '通知',
            settings: '设置',
            support: '支持'
        },
        hero: {
            title: '向世界发布您的故事',
            subtitle: '一个连接作者、翻译者和读者的革命性平台，支持9种语言。公平的收益分配。AI驱动的翻译。全球影响力。',
            start: '开始发布',
            learn: '了解更多'
        },
        features: {
            title: '为什么选择Publisher？',
            revenue: {
                title: '公平的收益分配',
                desc: '作者处理翻译和编辑时可获得高达70%的收益。透明的支付系统。'
            },
            translation: {
                title: 'AI翻译',
                desc: '免费AI翻译以触及全球受众。提供专业人工翻译服务。'
            },
            global: {
                title: '全球影响力',
                desc: '以9种语言发布：英语、日语、中文、西班牙语、法语、德语、韩语、阿拉伯语、葡萄牙语。'
            }
        },
        manga: {
            title: '漫画走向世界',
            desc: '我们专注于将日本漫画和漫画带给国际读者。我们的平台支持垂直和水平阅读格式。',
            feature1: '专业漫画阅读器',
            feature2: '支持日语到多种语言',
            feature3: '版权管理系统'
        },
        cta: {
            title: '准备好分享您的故事了吗？',
            subtitle: '加入成千上万触及全球受众的创作者',
            button: '今天就开始'
        },
        footer: {
            tagline: '连接全球创作者和读者',
            links: '快速链接',
            about: '关于',
            terms: '条款',
            privacy: '隐私',
            contact: '联系'
        },
        common: {
            loading: '加载中...',
            save: '保存',
            cancel: '取消',
            delete: '删除',
            edit: '编辑',
            submit: '提交',
            search: '搜索',
            filter: '筛选',
            all: '全部',
            none: '无',
            yes: '是',
            no: '否',
            back: '返回',
            next: '下一个',
            previous: '上一个'
        }
    },

    // =====================================================
    // Spanish (スペイン語)
    // =====================================================
    es: {
        nav: {
            revenue: 'Distribución de Ingresos',
            upload: 'Subir Obra',
            dashboard: 'Panel',
            register: 'Registrarse',
            login: 'Iniciar Sesión',
            logout: 'Cerrar Sesión',
            author: 'Autor',
            translator: 'Traductor',
            editor: 'Editor',
            notifications: 'Notificaciones',
            settings: 'Configuración',
            support: 'Soporte'
        },
        hero: {
            title: 'Publica Tu Historia al Mundo',
            subtitle: 'Una plataforma revolucionaria que conecta autores, traductores y lectores en 9 idiomas. Distribución justa de ingresos. Traducción con IA. Alcance global.',
            start: 'Comenzar a Publicar',
            learn: 'Más Información'
        },
        features: {
            title: '¿Por Qué Elegir Publisher?',
            revenue: {
                title: 'Distribución Justa de Ingresos',
                desc: 'Los autores ganan hasta el 70% al manejar traducción y edición. Sistema de pago transparente.'
            },
            translation: {
                title: 'Traducción IA',
                desc: 'Traducción IA gratuita para llegar a audiencias globales. Traducción humana profesional disponible.'
            },
            global: {
                title: 'Alcance Global',
                desc: 'Publica en 9 idiomas: inglés, japonés, chino, español, francés, alemán, coreano, árabe, portugués.'
            }
        },
        manga: {
            title: 'Manga al Mundo',
            desc: 'Nos especializamos en llevar manga japonés y cómics a audiencias internacionales. Nuestra plataforma soporta formatos de lectura vertical y horizontal.',
            feature1: 'Visor de manga profesional',
            feature2: 'Soporte de japonés a múltiples idiomas',
            feature3: 'Sistema de gestión de derechos'
        },
        cta: {
            title: '¿Listo para Compartir Tu Historia?',
            subtitle: 'Únete a miles de creadores llegando a audiencias globales',
            button: 'Comienza Hoy'
        },
        footer: {
            tagline: 'Conectando creadores y lectores en todo el mundo',
            links: 'Enlaces Rápidos',
            about: 'Acerca de',
            terms: 'Términos',
            privacy: 'Privacidad',
            contact: 'Contacto'
        },
        common: {
            loading: 'Cargando...',
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            submit: 'Enviar',
            search: 'Buscar',
            filter: 'Filtrar',
            all: 'Todo',
            none: 'Ninguno',
            yes: 'Sí',
            no: 'No',
            back: 'Volver',
            next: 'Siguiente',
            previous: 'Anterior'
        }
    },

    // =====================================================
    // French (フランス語)
    // =====================================================
    fr: {
        nav: {
            revenue: 'Partage des Revenus',
            upload: 'Télécharger une Œuvre',
            dashboard: 'Tableau de Bord',
            register: 'S\'inscrire',
            login: 'Connexion',
            logout: 'Déconnexion',
            author: 'Auteur',
            translator: 'Traducteur',
            editor: 'Éditeur',
            notifications: 'Notifications',
            settings: 'Paramètres',
            support: 'Support'
        },
        hero: {
            title: 'Publiez Votre Histoire au Monde',
            subtitle: 'Une plateforme révolutionnaire connectant auteurs, traducteurs et lecteurs dans 9 langues. Partage équitable des revenus. Traduction IA. Portée mondiale.',
            start: 'Commencer à Publier',
            learn: 'En Savoir Plus'
        },
        features: {
            title: 'Pourquoi Choisir Publisher?',
            revenue: {
                title: 'Partage Équitable des Revenus',
                desc: 'Les auteurs gagnent jusqu\'à 70% en gérant traduction et édition. Système de paiement transparent.'
            },
            translation: {
                title: 'Traduction IA',
                desc: 'Traduction IA gratuite pour atteindre un public mondial. Traduction humaine professionnelle disponible.'
            },
            global: {
                title: 'Portée Mondiale',
                desc: 'Publiez en 9 langues: anglais, japonais, chinois, espagnol, français, allemand, coréen, arabe, portugais.'
            }
        },
        manga: {
            title: 'Manga vers le Monde',
            desc: 'Nous sommes spécialisés dans l\'apport de manga japonais et de bandes dessinées à un public international.',
            feature1: 'Visionneuse de manga professionnelle',
            feature2: 'Support du japonais vers plusieurs langues',
            feature3: 'Système de gestion des droits'
        },
        cta: {
            title: 'Prêt à Partager Votre Histoire?',
            subtitle: 'Rejoignez des milliers de créateurs atteignant des audiences mondiales',
            button: 'Commencez Aujourd\'hui'
        },
        footer: {
            tagline: 'Connecter les créateurs et les lecteurs du monde entier',
            links: 'Liens Rapides',
            about: 'À Propos',
            terms: 'Conditions',
            privacy: 'Confidentialité',
            contact: 'Contact'
        },
        common: {
            loading: 'Chargement...',
            save: 'Enregistrer',
            cancel: 'Annuler',
            delete: 'Supprimer',
            edit: 'Modifier',
            submit: 'Soumettre',
            search: 'Rechercher',
            filter: 'Filtrer',
            all: 'Tout',
            none: 'Aucun',
            yes: 'Oui',
            no: 'Non',
            back: 'Retour',
            next: 'Suivant',
            previous: 'Précédent'
        }
    },

    // =====================================================
    // German (ドイツ語)
    // =====================================================
    de: {
        nav: {
            revenue: 'Umsatzbeteiligung',
            upload: 'Werk hochladen',
            dashboard: 'Dashboard',
            register: 'Registrieren',
            login: 'Anmelden',
            logout: 'Abmelden',
            author: 'Autor',
            translator: 'Übersetzer',
            editor: 'Redakteur',
            notifications: 'Benachrichtigungen',
            settings: 'Einstellungen',
            support: 'Support'
        },
        hero: {
            title: 'Veröffentlichen Sie Ihre Geschichte',
            subtitle: 'Eine revolutionäre Plattform, die Autoren, Übersetzer und Leser in 9 Sprachen verbindet. Faire Umsatzbeteiligung. KI-gestützte Übersetzung. Globale Reichweite.',
            start: 'Veröffentlichung starten',
            learn: 'Mehr erfahren'
        },
        features: {
            title: 'Warum Publisher wählen?',
            revenue: {
                title: 'Faire Umsatzbeteiligung',
                desc: 'Autoren verdienen bis zu 70%, wenn sie Übersetzung und Redaktion übernehmen. Transparentes Zahlungssystem.'
            },
            translation: {
                title: 'KI-Übersetzung',
                desc: 'Kostenlose KI-Übersetzung für globale Zielgruppen. Professionelle menschliche Übersetzung verfügbar.'
            },
            global: {
                title: 'Globale Reichweite',
                desc: 'Veröffentlichen in 9 Sprachen: Englisch, Japanisch, Chinesisch, Spanisch, Französisch, Deutsch, Koreanisch, Arabisch, Portugiesisch.'
            }
        },
        manga: {
            title: 'Manga in die Welt',
            desc: 'Wir sind spezialisiert darauf, japanische Manga und Comics einem internationalen Publikum zugänglich zu machen.',
            feature1: 'Professioneller Manga-Viewer',
            feature2: 'Unterstützung von Japanisch in mehrere Sprachen',
            feature3: 'Rechteverwaltungssystem'
        },
        cta: {
            title: 'Bereit, Ihre Geschichte zu teilen?',
            subtitle: 'Treten Sie Tausenden von Kreativen bei, die globale Zielgruppen erreichen',
            button: 'Heute starten'
        },
        footer: {
            tagline: 'Verbinden von Kreativen und Lesern weltweit',
            links: 'Schnelllinks',
            about: 'Über uns',
            terms: 'Bedingungen',
            privacy: 'Datenschutz',
            contact: 'Kontakt'
        },
        common: {
            loading: 'Laden...',
            save: 'Speichern',
            cancel: 'Abbrechen',
            delete: 'Löschen',
            edit: 'Bearbeiten',
            submit: 'Absenden',
            search: 'Suchen',
            filter: 'Filtern',
            all: 'Alle',
            none: 'Keine',
            yes: 'Ja',
            no: 'Nein',
            back: 'Zurück',
            next: 'Weiter',
            previous: 'Zurück'
        }
    },

    // =====================================================
    // Korean (韓国語) - 新規追加
    // =====================================================
    ko: {
        nav: {
            revenue: '수익 배분',
            upload: '작품 업로드',
            dashboard: '대시보드',
            register: '등록',
            login: '로그인',
            logout: '로그아웃',
            author: '저자',
            translator: '번역가',
            editor: '편집자',
            notifications: '알림',
            settings: '설정',
            support: '지원'
        },
        hero: {
            title: '당신의 이야기를 세계로',
            subtitle: '9개 언어로 저자, 번역가, 독자를 연결하는 혁신적인 플랫폼. 공정한 수익 배분. AI 번역. 글로벌 도달.',
            start: '출판 시작하기',
            learn: '자세히 보기'
        },
        features: {
            title: 'Publisher를 선택하는 이유',
            revenue: {
                title: '공정한 수익 배분',
                desc: '저자는 번역과 편집을 담당할 때 최대 70%를 획득. 투명한 결제 시스템.'
            },
            translation: {
                title: 'AI 번역',
                desc: '무료 AI 번역으로 전 세계 독자에게 도달. 전문 인간 번역도 이용 가능.'
            },
            global: {
                title: '글로벌 도달',
                desc: '9개 언어로 출판: 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어, 한국어, 아랍어, 포르투갈어.'
            }
        },
        manga: {
            title: '만화를 세계로',
            desc: '일본 만화와 코믹스를 국제 독자에게 전달하는 것을 전문으로 합니다. 세로 및 가로 읽기 형식을 지원.',
            feature1: '전문 만화 뷰어',
            feature2: '일본어에서 다국어 지원',
            feature3: '권리 관리 시스템'
        },
        cta: {
            title: '이야기를 공유할 준비가 되셨나요?',
            subtitle: '전 세계 독자에게 도달하는 수천 명의 창작자와 함께하세요',
            button: '오늘 시작하기'
        },
        footer: {
            tagline: '전 세계 창작자와 독자를 연결',
            links: '빠른 링크',
            about: '소개',
            terms: '이용약관',
            privacy: '개인정보',
            contact: '연락처'
        },
        common: {
            loading: '로딩 중...',
            save: '저장',
            cancel: '취소',
            delete: '삭제',
            edit: '편집',
            submit: '제출',
            search: '검색',
            filter: '필터',
            all: '전체',
            none: '없음',
            yes: '예',
            no: '아니오',
            back: '뒤로',
            next: '다음',
            previous: '이전'
        }
    },

    // =====================================================
    // Arabic (アラビア語) - 新規追加
    // =====================================================
    ar: {
        nav: {
            revenue: 'توزيع الإيرادات',
            upload: 'رفع عمل',
            dashboard: 'لوحة التحكم',
            register: 'تسجيل',
            login: 'تسجيل الدخول',
            logout: 'تسجيل الخروج',
            author: 'مؤلف',
            translator: 'مترجم',
            editor: 'محرر',
            notifications: 'إشعارات',
            settings: 'إعدادات',
            support: 'دعم'
        },
        hero: {
            title: 'انشر قصتك للعالم',
            subtitle: 'منصة ثورية تربط المؤلفين والمترجمين والقراء عبر 9 لغات. توزيع عادل للإيرادات. ترجمة بالذكاء الاصطناعي. وصول عالمي.',
            start: 'ابدأ النشر',
            learn: 'اعرف المزيد'
        },
        features: {
            title: 'لماذا تختار Publisher؟',
            revenue: {
                title: 'توزيع عادل للإيرادات',
                desc: 'يكسب المؤلفون حتى 70٪ عند التعامل مع الترجمة والتحرير. نظام دفع شفاف.'
            },
            translation: {
                title: 'ترجمة AI',
                desc: 'ترجمة AI مجانية للوصول إلى جمهور عالمي. ترجمة بشرية احترافية متاحة.'
            },
            global: {
                title: 'وصول عالمي',
                desc: 'النشر بـ 9 لغات: الإنجليزية، اليابانية، الصينية، الإسبانية، الفرنسية، الألمانية، الكورية، العربية، البرتغالية.'
            }
        },
        manga: {
            title: 'المانغا إلى العالم',
            desc: 'نحن متخصصون في جلب المانغا اليابانية والقصص المصورة إلى الجماهير الدولية.',
            feature1: 'عارض مانغا احترافي',
            feature2: 'دعم من اليابانية إلى لغات متعددة',
            feature3: 'نظام إدارة الحقوق'
        },
        cta: {
            title: 'مستعد لمشاركة قصتك؟',
            subtitle: 'انضم إلى آلاف المبدعين الذين يصلون إلى جماهير عالمية',
            button: 'ابدأ اليوم'
        },
        footer: {
            tagline: 'ربط المبدعين والقراء حول العالم',
            links: 'روابط سريعة',
            about: 'حول',
            terms: 'الشروط',
            privacy: 'الخصوصية',
            contact: 'اتصل'
        },
        common: {
            loading: 'جاري التحميل...',
            save: 'حفظ',
            cancel: 'إلغاء',
            delete: 'حذف',
            edit: 'تعديل',
            submit: 'إرسال',
            search: 'بحث',
            filter: 'تصفية',
            all: 'الكل',
            none: 'لا شيء',
            yes: 'نعم',
            no: 'لا',
            back: 'رجوع',
            next: 'التالي',
            previous: 'السابق'
        }
    },

    // =====================================================
    // Portuguese (ポルトガル語) - 新規追加
    // =====================================================
    pt: {
        nav: {
            revenue: 'Divisão de Receita',
            upload: 'Enviar Obra',
            dashboard: 'Painel',
            register: 'Registrar',
            login: 'Entrar',
            logout: 'Sair',
            author: 'Autor',
            translator: 'Tradutor',
            editor: 'Editor',
            notifications: 'Notificações',
            settings: 'Configurações',
            support: 'Suporte'
        },
        hero: {
            title: 'Publique Sua História para o Mundo',
            subtitle: 'Uma plataforma revolucionária conectando autores, tradutores e leitores em 9 idiomas. Divisão justa de receita. Tradução com IA. Alcance global.',
            start: 'Começar a Publicar',
            learn: 'Saiba Mais'
        },
        features: {
            title: 'Por Que Escolher Publisher?',
            revenue: {
                title: 'Divisão Justa de Receita',
                desc: 'Autores ganham até 70% ao lidar com tradução e edição. Sistema de pagamento transparente.'
            },
            translation: {
                title: 'Tradução IA',
                desc: 'Tradução IA gratuita para alcançar audiências globais. Tradução humana profissional disponível.'
            },
            global: {
                title: 'Alcance Global',
                desc: 'Publique em 9 idiomas: inglês, japonês, chinês, espanhol, francês, alemão, coreano, árabe, português.'
            }
        },
        manga: {
            title: 'Mangá para o Mundo',
            desc: 'Somos especializados em trazer mangás japoneses e quadrinhos para audiências internacionais. Nossa plataforma suporta formatos de leitura vertical e horizontal.',
            feature1: 'Visualizador de mangá profissional',
            feature2: 'Suporte de japonês para múltiplos idiomas',
            feature3: 'Sistema de gestão de direitos'
        },
        cta: {
            title: 'Pronto para Compartilhar Sua História?',
            subtitle: 'Junte-se a milhares de criadores alcançando audiências globais',
            button: 'Comece Hoje'
        },
        footer: {
            tagline: 'Conectando criadores e leitores em todo o mundo',
            links: 'Links Rápidos',
            about: 'Sobre',
            terms: 'Termos',
            privacy: 'Privacidade',
            contact: 'Contato'
        },
        common: {
            loading: 'Carregando...',
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            submit: 'Enviar',
            search: 'Buscar',
            filter: 'Filtrar',
            all: 'Todos',
            none: 'Nenhum',
            yes: 'Sim',
            no: 'Não',
            back: 'Voltar',
            next: 'Próximo',
            previous: 'Anterior'
        }
    }
};

// =====================================================
// 言語コード一覧（利用可能な言語）
// =====================================================
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

// =====================================================
// 翻訳ヘルパー関数
// =====================================================

/**
 * 翻訳を取得
 * @param {string} key - ドット区切りのキー (例: 'nav.dashboard')
 * @param {string} lang - 言語コード (例: 'ja')
 * @returns {string} 翻訳テキスト
 */
function t(key, lang = null) {
    const currentLang = lang || getCurrentLanguage();
    const keys = key.split('.');
    let result = translations[currentLang];
    
    for (const k of keys) {
        if (result && result[k]) {
            result = result[k];
        } else {
            // フォールバック: 英語を使用
            result = translations.en;
            for (const fallbackKey of keys) {
                if (result && result[fallbackKey]) {
                    result = result[fallbackKey];
                } else {
                    return key; // 見つからない場合はキーを返す
                }
            }
            break;
        }
    }
    
    return typeof result === 'string' ? result : key;
}

/**
 * 現在の言語を取得
 * @returns {string} 言語コード
 */
function getCurrentLanguage() {
    return localStorage.getItem('preferredLanguage') || 
           navigator.language.split('-')[0] || 
           'en';
}

/**
 * 言語を設定
 * @param {string} lang - 言語コード
 */
function setLanguage(lang) {
    if (availableLanguages[lang]) {
        localStorage.setItem('preferredLanguage', lang);
        
        // RTL言語の場合、ドキュメントのdir属性を更新
        document.documentElement.dir = availableLanguages[lang].rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
        
        // カスタムイベントを発火
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }
}

/**
 * 言語が利用可能かチェック
 * @param {string} lang - 言語コード
 * @returns {boolean}
 */
function isLanguageAvailable(lang) {
    return !!availableLanguages[lang];
}

// グローバルに公開
window.translations = translations;
window.availableLanguages = availableLanguages;
window.t = t;
window.getCurrentLanguage = getCurrentLanguage;
window.setLanguage = setLanguage;
window.isLanguageAvailable = isLanguageAvailable;
