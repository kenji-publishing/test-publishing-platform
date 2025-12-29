/**
 * FAQ Multilingual Data (9 Languages)
 * 多言語FAQ データ
 * 
 * Supported Languages: en, ja, zh, es, fr, de, ko, ar, pt
 */

const faqMultilingualData = [
    // =============================================
    // FAQ 1: アカウント作成 (Account Creation)
    // =============================================
    {
        id: 1,
        category_id: 1,
        // Questions
        question_en: 'How do I create an account?',
        question_ja: 'アカウントを作成するにはどうすればいいですか？',
        question_zh: '如何创建账户？',
        question_es: '¿Cómo creo una cuenta?',
        question_fr: 'Comment créer un compte ?',
        question_de: 'Wie erstelle ich ein Konto?',
        question_ko: '계정을 만들려면 어떻게 해야 하나요?',
        question_ar: 'كيف أنشئ حسابًا؟',
        question_pt: 'Como crio uma conta?',
        // Answers
        answer_en: 'Click the "Sign Up" button at the top right of the homepage and enter your email address and password. If you want to register as an author, translator, or editor, please use the dedicated registration page for each role.',
        answer_ja: 'トップページ右上の「新規登録」ボタンをクリックし、メールアドレスとパスワードを入力してください。著者・翻訳者・編集者として登録する場合は、それぞれ専用の登録ページをご利用ください。',
        answer_zh: '点击首页右上角的"注册"按钮，输入您的电子邮件地址和密码。如果您想以作者、译者或编辑身份注册，请使用各角色专用的注册页面。',
        answer_es: 'Haga clic en el botón "Registrarse" en la esquina superior derecha de la página de inicio e ingrese su correo electrónico y contraseña. Si desea registrarse como autor, traductor o editor, utilice la página de registro dedicada para cada rol.',
        answer_fr: 'Cliquez sur le bouton "S\'inscrire" en haut à droite de la page d\'accueil et entrez votre adresse e-mail et mot de passe. Si vous souhaitez vous inscrire en tant qu\'auteur, traducteur ou éditeur, veuillez utiliser la page d\'inscription dédiée.',
        answer_de: 'Klicken Sie oben rechts auf der Startseite auf "Registrieren" und geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein. Wenn Sie sich als Autor, Übersetzer oder Redakteur registrieren möchten, nutzen Sie bitte die entsprechende Registrierungsseite.',
        answer_ko: '홈페이지 오른쪽 상단의 "회원가입" 버튼을 클릭하고 이메일 주소와 비밀번호를 입력하세요. 저자, 번역가 또는 편집자로 등록하려면 각 역할별 전용 등록 페이지를 이용해 주세요.',
        answer_ar: 'انقر على زر "التسجيل" في الزاوية العلوية اليمنى من الصفحة الرئيسية وأدخل بريدك الإلكتروني وكلمة المرور. إذا كنت ترغب في التسجيل كمؤلف أو مترجم أو محرر، يرجى استخدام صفحة التسجيل المخصصة لكل دور.',
        answer_pt: 'Clique no botão "Cadastrar" no canto superior direito da página inicial e insira seu e-mail e senha. Se você deseja se registrar como autor, tradutor ou editor, use a página de registro dedicada para cada função.',
        // Category Names
        category_name_en: 'Account',
        category_name_ja: 'アカウント',
        category_name_zh: '账户',
        category_name_es: 'Cuenta',
        category_name_fr: 'Compte',
        category_name_de: 'Konto',
        category_name_ko: '계정',
        category_name_ar: 'الحساب',
        category_name_pt: 'Conta',
        helpful_count: 15,
        not_helpful_count: 2
    },

    // =============================================
    // FAQ 2: パスワード忘れ (Forgot Password)
    // =============================================
    {
        id: 2,
        category_id: 1,
        question_en: 'I forgot my password',
        question_ja: 'パスワードを忘れてしまいました',
        question_zh: '我忘记了密码',
        question_es: 'Olvidé mi contraseña',
        question_fr: 'J\'ai oublié mon mot de passe',
        question_de: 'Ich habe mein Passwort vergessen',
        question_ko: '비밀번호를 잊어버렸습니다',
        question_ar: 'نسيت كلمة المرور',
        question_pt: 'Esqueci minha senha',
        answer_en: 'Click the "Forgot your password?" link on the login page and enter your registered email address. We will send you a password reset link via email.',
        answer_ja: 'ログインページの「パスワードをお忘れですか？」リンクをクリックし、登録時のメールアドレスを入力してください。パスワードリセット用のリンクをメールでお送りします。',
        answer_zh: '点击登录页面上的"忘记密码？"链接，输入您注册时的电子邮件地址。我们将通过电子邮件向您发送密码重置链接。',
        answer_es: 'Haga clic en el enlace "¿Olvidó su contraseña?" en la página de inicio de sesión e ingrese su correo electrónico registrado. Le enviaremos un enlace para restablecer la contraseña por correo electrónico.',
        answer_fr: 'Cliquez sur le lien "Mot de passe oublié ?" sur la page de connexion et entrez votre adresse e-mail enregistrée. Nous vous enverrons un lien de réinitialisation par e-mail.',
        answer_de: 'Klicken Sie auf der Anmeldeseite auf "Passwort vergessen?" und geben Sie Ihre registrierte E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen des Passworts per E-Mail.',
        answer_ko: '로그인 페이지에서 "비밀번호를 잊으셨나요?" 링크를 클릭하고 등록된 이메일 주소를 입력하세요. 비밀번호 재설정 링크를 이메일로 보내드립니다.',
        answer_ar: 'انقر على رابط "نسيت كلمة المرور؟" في صفحة تسجيل الدخول وأدخل بريدك الإلكتروني المسجل. سنرسل لك رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني.',
        answer_pt: 'Clique no link "Esqueceu a senha?" na página de login e insira seu e-mail cadastrado. Enviaremos um link para redefinir a senha por e-mail.',
        category_name_en: 'Account',
        category_name_ja: 'アカウント',
        category_name_zh: '账户',
        category_name_es: 'Cuenta',
        category_name_fr: 'Compte',
        category_name_de: 'Konto',
        category_name_ko: '계정',
        category_name_ar: 'الحساب',
        category_name_pt: 'Conta',
        helpful_count: 12,
        not_helpful_count: 1
    },

    // =============================================
    // FAQ 3: メールアドレス変更 (Change Email)
    // =============================================
    {
        id: 3,
        category_id: 1,
        question_en: 'I want to change my email address',
        question_ja: 'メールアドレスを変更したい',
        question_zh: '我想更改我的电子邮件地址',
        question_es: 'Quiero cambiar mi dirección de correo electrónico',
        question_fr: 'Je veux changer mon adresse e-mail',
        question_de: 'Ich möchte meine E-Mail-Adresse ändern',
        question_ko: '이메일 주소를 변경하고 싶습니다',
        question_ar: 'أريد تغيير عنوان بريدي الإلكتروني',
        question_pt: 'Quero alterar meu endereço de e-mail',
        answer_en: 'You can change it from "Settings" → "Account Settings" on your dashboard. A confirmation email will be sent to your new email address. Click the link to complete the change.',
        answer_ja: 'ダッシュボードの「設定」→「アカウント設定」から変更できます。新しいメールアドレスに確認メールが送信されますので、リンクをクリックして変更を完了してください。',
        answer_zh: '您可以从仪表板的"设置"→"账户设置"中更改。确认邮件将发送到您的新电子邮件地址，请点击链接完成更改。',
        answer_es: 'Puede cambiarlo desde "Configuración" → "Configuración de cuenta" en su panel. Se enviará un correo de confirmación a su nueva dirección. Haga clic en el enlace para completar el cambio.',
        answer_fr: 'Vous pouvez la modifier depuis "Paramètres" → "Paramètres du compte" dans votre tableau de bord. Un e-mail de confirmation sera envoyé à votre nouvelle adresse. Cliquez sur le lien pour terminer.',
        answer_de: 'Sie können sie unter "Einstellungen" → "Kontoeinstellungen" in Ihrem Dashboard ändern. Eine Bestätigungs-E-Mail wird an Ihre neue Adresse gesendet. Klicken Sie auf den Link, um die Änderung abzuschließen.',
        answer_ko: '대시보드의 "설정" → "계정 설정"에서 변경할 수 있습니다. 새 이메일 주소로 확인 이메일이 발송되며, 링크를 클릭하여 변경을 완료하세요.',
        answer_ar: 'يمكنك تغييره من "الإعدادات" → "إعدادات الحساب" في لوحة التحكم. سيتم إرسال بريد تأكيد إلى عنوانك الجديد. انقر على الرابط لإكمال التغيير.',
        answer_pt: 'Você pode alterá-lo em "Configurações" → "Configurações da conta" no seu painel. Um e-mail de confirmação será enviado para o novo endereço. Clique no link para concluir a alteração.',
        category_name_en: 'Account',
        category_name_ja: 'アカウント',
        category_name_zh: '账户',
        category_name_es: 'Cuenta',
        category_name_fr: 'Compte',
        category_name_de: 'Konto',
        category_name_ko: '계정',
        category_name_ar: 'الحساب',
        category_name_pt: 'Conta',
        helpful_count: 8,
        not_helpful_count: 0
    },

    // =============================================
    // FAQ 4: 支払い方法 (Payment Methods)
    // =============================================
    {
        id: 4,
        category_id: 2,
        question_en: 'What payment methods are available?',
        question_ja: '利用可能な支払い方法は？',
        question_zh: '可用的支付方式有哪些？',
        question_es: '¿Qué métodos de pago están disponibles?',
        question_fr: 'Quels modes de paiement sont disponibles ?',
        question_de: 'Welche Zahlungsmethoden sind verfügbar?',
        question_ko: '어떤 결제 방법을 사용할 수 있나요?',
        question_ar: 'ما هي طرق الدفع المتاحة؟',
        question_pt: 'Quais métodos de pagamento estão disponíveis?',
        answer_en: 'We accept credit cards (Visa, Mastercard, American Express) and PayPal.',
        answer_ja: 'クレジットカード（Visa、Mastercard、American Express）およびPayPalがご利用いただけます。',
        answer_zh: '我们接受信用卡（Visa、Mastercard、American Express）和PayPal。',
        answer_es: 'Aceptamos tarjetas de crédito (Visa, Mastercard, American Express) y PayPal.',
        answer_fr: 'Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et PayPal.',
        answer_de: 'Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express) und PayPal.',
        answer_ko: '신용카드(Visa, Mastercard, American Express)와 PayPal을 사용할 수 있습니다.',
        answer_ar: 'نقبل بطاقات الائتمان (Visa و Mastercard و American Express) و PayPal.',
        answer_pt: 'Aceitamos cartões de crédito (Visa, Mastercard, American Express) e PayPal.',
        category_name_en: 'Payment',
        category_name_ja: 'お支払い',
        category_name_zh: '付款',
        category_name_es: 'Pago',
        category_name_fr: 'Paiement',
        category_name_de: 'Zahlung',
        category_name_ko: '결제',
        category_name_ar: 'الدفع',
        category_name_pt: 'Pagamento',
        helpful_count: 20,
        not_helpful_count: 0
    },

    // =============================================
    // FAQ 5: 返金 (Refund)
    // =============================================
    {
        id: 5,
        category_id: 2,
        question_en: 'How do I request a refund?',
        question_ja: '返金をリクエストするには？',
        question_zh: '如何申请退款？',
        question_es: '¿Cómo solicito un reembolso?',
        question_fr: 'Comment demander un remboursement ?',
        question_de: 'Wie beantrage ich eine Rückerstattung?',
        question_ko: '환불을 요청하려면 어떻게 해야 하나요?',
        question_ar: 'كيف أطلب استرداد المبلغ؟',
        question_pt: 'Como solicito um reembolso?',
        answer_en: 'If within 7 days of purchase, you can submit a refund request from "Purchase History" on your dashboard. However, if you have viewed more than 50% of the work, it is not eligible for a refund.',
        answer_ja: '購入から7日以内であれば、ダッシュボードの「購入履歴」から返金リクエストを送信できます。ただし、作品を50%以上閲覧した場合は返金対象外となります。',
        answer_zh: '如果在购买后7天内，您可以从仪表板的"购买历史"提交退款申请。但是，如果您已经阅读了作品的50%以上，则不符合退款条件。',
        answer_es: 'Si está dentro de los 7 días posteriores a la compra, puede enviar una solicitud de reembolso desde "Historial de compras" en su panel. Sin embargo, si ha visto más del 50% de la obra, no es elegible para reembolso.',
        answer_fr: 'Si vous êtes dans les 7 jours suivant l\'achat, vous pouvez soumettre une demande de remboursement depuis "Historique des achats" sur votre tableau de bord. Cependant, si vous avez consulté plus de 50% de l\'œuvre, le remboursement n\'est pas possible.',
        answer_de: 'Innerhalb von 7 Tagen nach dem Kauf können Sie über "Kaufhistorie" in Ihrem Dashboard eine Rückerstattung beantragen. Wenn Sie jedoch mehr als 50% des Werkes angesehen haben, ist keine Rückerstattung möglich.',
        answer_ko: '구매 후 7일 이내라면 대시보드의 "구매 내역"에서 환불 요청을 제출할 수 있습니다. 단, 작품의 50% 이상을 열람한 경우에는 환불 대상이 아닙니다.',
        answer_ar: 'إذا كنت خلال 7 أيام من الشراء، يمكنك تقديم طلب استرداد من "سجل المشتريات" في لوحة التحكم. ومع ذلك، إذا كنت قد شاهدت أكثر من 50% من العمل، فلن تكون مؤهلاً للاسترداد.',
        answer_pt: 'Se estiver dentro de 7 dias após a compra, você pode enviar uma solicitação de reembolso em "Histórico de compras" no seu painel. No entanto, se você visualizou mais de 50% da obra, não é elegível para reembolso.',
        category_name_en: 'Payment',
        category_name_ja: 'お支払い',
        category_name_zh: '付款',
        category_name_es: 'Pago',
        category_name_fr: 'Paiement',
        category_name_de: 'Zahlung',
        category_name_ko: '결제',
        category_name_ar: 'الدفع',
        category_name_pt: 'Pagamento',
        helpful_count: 10,
        not_helpful_count: 2
    },

    // =============================================
    // FAQ 6: AI翻訳精度 (AI Translation Accuracy)
    // =============================================
    {
        id: 6,
        category_id: 4,
        question_en: 'How accurate is the AI translation?',
        question_ja: 'AI翻訳の精度はどのくらいですか？',
        question_zh: 'AI翻译的准确度如何？',
        question_es: '¿Qué tan precisa es la traducción por IA?',
        question_fr: 'Quelle est la précision de la traduction IA ?',
        question_de: 'Wie genau ist die KI-Übersetzung?',
        question_ko: 'AI 번역의 정확도는 어떤가요?',
        question_ar: 'ما مدى دقة الترجمة بالذكاء الاصطناعي؟',
        question_pt: 'Qual é a precisão da tradução por IA?',
        answer_en: 'AI translation uses advanced machine learning models and can translate general text with high accuracy. However, for technical terms or literary expressions, we recommend translation by professional translators.',
        answer_ja: 'AI翻訳は高度な機械学習モデルを使用しており、一般的な文章については高い精度で翻訳できます。ただし、専門用語や文学的表現については、プロの翻訳者による翻訳をお勧めします。',
        answer_zh: 'AI翻译使用先进的机器学习模型，可以高精度翻译一般文本。但是，对于专业术语或文学表达，我们建议使用专业翻译人员的翻译。',
        answer_es: 'La traducción por IA utiliza modelos avanzados de aprendizaje automático y puede traducir texto general con alta precisión. Sin embargo, para términos técnicos o expresiones literarias, recomendamos la traducción por traductores profesionales.',
        answer_fr: 'La traduction IA utilise des modèles d\'apprentissage automatique avancés et peut traduire du texte général avec une grande précision. Cependant, pour les termes techniques ou les expressions littéraires, nous recommandons la traduction par des traducteurs professionnels.',
        answer_de: 'Die KI-Übersetzung verwendet fortschrittliche Machine-Learning-Modelle und kann allgemeine Texte mit hoher Genauigkeit übersetzen. Für Fachbegriffe oder literarische Ausdrücke empfehlen wir jedoch die Übersetzung durch professionelle Übersetzer.',
        answer_ko: 'AI 번역은 고급 머신러닝 모델을 사용하여 일반 텍스트를 높은 정확도로 번역할 수 있습니다. 다만 전문 용어나 문학적 표현의 경우 전문 번역가의 번역을 권장합니다.',
        answer_ar: 'تستخدم الترجمة بالذكاء الاصطناعي نماذج تعلم آلي متقدمة ويمكنها ترجمة النص العام بدقة عالية. ومع ذلك، للمصطلحات التقنية أو التعبيرات الأدبية، نوصي بالترجمة من قبل مترجمين محترفين.',
        answer_pt: 'A tradução por IA usa modelos avançados de aprendizado de máquina e pode traduzir texto geral com alta precisão. No entanto, para termos técnicos ou expressões literárias, recomendamos a tradução por tradutores profissionais.',
        category_name_en: 'Translation',
        category_name_ja: '翻訳サービス',
        category_name_zh: '翻译服务',
        category_name_es: 'Traducción',
        category_name_fr: 'Traduction',
        category_name_de: 'Übersetzung',
        category_name_ko: '번역 서비스',
        category_name_ar: 'الترجمة',
        category_name_pt: 'Tradução',
        helpful_count: 18,
        not_helpful_count: 3
    },

    // =============================================
    // FAQ 7: 翻訳者依頼 (Request Translator)
    // =============================================
    {
        id: 7,
        category_id: 4,
        question_en: 'How do I directly request a translator?',
        question_ja: '翻訳者に直接依頼するには？',
        question_zh: '如何直接联系翻译人员？',
        question_es: '¿Cómo solicito directamente a un traductor?',
        question_fr: 'Comment contacter directement un traducteur ?',
        question_de: 'Wie kontaktiere ich einen Übersetzer direkt?',
        question_ko: '번역가에게 직접 의뢰하려면 어떻게 해야 하나요?',
        question_ar: 'كيف أطلب من مترجم مباشرة؟',
        question_pt: 'Como solicito diretamente a um tradutor?',
        answer_en: 'From the "Find Translators" page, you can search for translators by language pair or specialty. Check the profile of a translator you are interested in and submit a request form using the "Request Translation" button.',
        answer_ja: '「翻訳者を探す」ページから、言語ペアや専門分野で翻訳者を検索できます。気になる翻訳者のプロフィールを確認し、「翻訳を依頼する」ボタンから依頼フォームを送信してください。',
        answer_zh: '在"寻找翻译"页面，您可以按语言对或专业领域搜索翻译人员。查看感兴趣的翻译人员资料后，点击"请求翻译"按钮提交申请表。',
        answer_es: 'Desde la página "Buscar Traductores", puede buscar traductores por par de idiomas o especialidad. Revise el perfil del traductor que le interese y envíe un formulario de solicitud usando el botón "Solicitar Traducción".',
        answer_fr: 'Depuis la page "Trouver des traducteurs", vous pouvez rechercher des traducteurs par paire de langues ou spécialité. Consultez le profil d\'un traducteur qui vous intéresse et soumettez une demande via le bouton "Demander une traduction".',
        answer_de: 'Auf der Seite "Übersetzer finden" können Sie nach Sprachpaar oder Fachgebiet suchen. Sehen Sie sich das Profil eines interessanten Übersetzers an und senden Sie über die Schaltfläche "Übersetzung anfordern" eine Anfrage.',
        answer_ko: '"번역가 찾기" 페이지에서 언어 쌍이나 전문 분야로 번역가를 검색할 수 있습니다. 관심 있는 번역가의 프로필을 확인한 후 "번역 요청" 버튼을 클릭하여 요청서를 제출하세요.',
        answer_ar: 'من صفحة "البحث عن مترجمين"، يمكنك البحث عن مترجمين حسب زوج اللغات أو التخصص. راجع ملف المترجم الذي يثير اهتمامك وأرسل نموذج طلب باستخدام زر "طلب ترجمة".',
        answer_pt: 'Na página "Encontrar Tradutores", você pode pesquisar tradutores por par de idiomas ou especialidade. Confira o perfil de um tradutor de interesse e envie um formulário de solicitação usando o botão "Solicitar Tradução".',
        category_name_en: 'Translation',
        category_name_ja: '翻訳サービス',
        category_name_zh: '翻译服务',
        category_name_es: 'Traducción',
        category_name_fr: 'Traduction',
        category_name_de: 'Übersetzung',
        category_name_ko: '번역 서비스',
        category_name_ar: 'الترجمة',
        category_name_pt: 'Tradução',
        helpful_count: 14,
        not_helpful_count: 1
    },

    // =============================================
    // FAQ 8: 作品が表示されない (Work Not Displaying)
    // =============================================
    {
        id: 8,
        category_id: 7,
        question_en: 'The work is not displaying',
        question_ja: '作品が表示されません',
        question_zh: '作品无法显示',
        question_es: 'La obra no se muestra',
        question_fr: 'L\'œuvre ne s\'affiche pas',
        question_de: 'Das Werk wird nicht angezeigt',
        question_ko: '작품이 표시되지 않습니다',
        question_ar: 'العمل لا يظهر',
        question_pt: 'A obra não está sendo exibida',
        answer_en: 'Please try the following: 1) Clear your browser cache, 2) Try a different browser, 3) Check your internet connection. If the problem persists, please contact us.',
        answer_ja: '以下をお試しください：1) ブラウザのキャッシュをクリア、2) 別のブラウザで試す、3) インターネット接続を確認。問題が続く場合はお問い合わせください。',
        answer_zh: '请尝试以下操作：1) 清除浏览器缓存，2) 尝试使用其他浏览器，3) 检查网络连接。如果问题持续存在，请联系我们。',
        answer_es: 'Por favor intente lo siguiente: 1) Limpie la caché del navegador, 2) Pruebe con otro navegador, 3) Verifique su conexión a internet. Si el problema persiste, contáctenos.',
        answer_fr: 'Veuillez essayer ce qui suit : 1) Videz le cache de votre navigateur, 2) Essayez un autre navigateur, 3) Vérifiez votre connexion internet. Si le problème persiste, contactez-nous.',
        answer_de: 'Bitte versuchen Sie Folgendes: 1) Browser-Cache leeren, 2) Anderen Browser verwenden, 3) Internetverbindung prüfen. Wenn das Problem weiterhin besteht, kontaktieren Sie uns.',
        answer_ko: '다음을 시도해 주세요: 1) 브라우저 캐시 삭제, 2) 다른 브라우저 사용, 3) 인터넷 연결 확인. 문제가 계속되면 문의해 주세요.',
        answer_ar: 'يرجى تجربة ما يلي: 1) مسح ذاكرة التخزين المؤقت للمتصفح، 2) تجربة متصفح آخر، 3) التحقق من اتصال الإنترنت. إذا استمرت المشكلة، يرجى الاتصال بنا.',
        answer_pt: 'Por favor, tente o seguinte: 1) Limpe o cache do navegador, 2) Tente outro navegador, 3) Verifique sua conexão com a internet. Se o problema persistir, entre em contato conosco.',
        category_name_en: 'Technical Issues',
        category_name_ja: '技術的な問題',
        category_name_zh: '技术问题',
        category_name_es: 'Problemas Técnicos',
        category_name_fr: 'Problèmes Techniques',
        category_name_de: 'Technische Probleme',
        category_name_ko: '기술 문제',
        category_name_ar: 'مشاكل تقنية',
        category_name_pt: 'Problemas Técnicos',
        helpful_count: 7,
        not_helpful_count: 1
    },

    // =============================================
    // FAQ 9: 推奨ブラウザ (Recommended Browser)
    // =============================================
    {
        id: 9,
        category_id: 7,
        question_en: 'What is the recommended browser?',
        question_ja: '推奨ブラウザは何ですか？',
        question_zh: '推荐使用什么浏览器？',
        question_es: '¿Cuál es el navegador recomendado?',
        question_fr: 'Quel est le navigateur recommandé ?',
        question_de: 'Welcher Browser wird empfohlen?',
        question_ko: '권장 브라우저는 무엇인가요?',
        question_ar: 'ما هو المتصفح الموصى به؟',
        question_pt: 'Qual é o navegador recomendado?',
        answer_en: 'We recommend the latest versions of Google Chrome, Firefox, Safari, and Microsoft Edge. Internet Explorer is not supported.',
        answer_ja: 'Google Chrome、Firefox、Safari、Microsoft Edgeの最新版を推奨しています。Internet Explorerはサポートしておりません。',
        answer_zh: '我们推荐使用最新版本的Google Chrome、Firefox、Safari和Microsoft Edge。不支持Internet Explorer。',
        answer_es: 'Recomendamos las últimas versiones de Google Chrome, Firefox, Safari y Microsoft Edge. Internet Explorer no es compatible.',
        answer_fr: 'Nous recommandons les dernières versions de Google Chrome, Firefox, Safari et Microsoft Edge. Internet Explorer n\'est pas pris en charge.',
        answer_de: 'Wir empfehlen die neuesten Versionen von Google Chrome, Firefox, Safari und Microsoft Edge. Internet Explorer wird nicht unterstützt.',
        answer_ko: 'Google Chrome, Firefox, Safari, Microsoft Edge의 최신 버전을 권장합니다. Internet Explorer는 지원하지 않습니다.',
        answer_ar: 'نوصي بأحدث إصدارات Google Chrome و Firefox و Safari و Microsoft Edge. لا يتم دعم Internet Explorer.',
        answer_pt: 'Recomendamos as versões mais recentes do Google Chrome, Firefox, Safari e Microsoft Edge. O Internet Explorer não é suportado.',
        category_name_en: 'Technical Issues',
        category_name_ja: '技術的な問題',
        category_name_zh: '技术问题',
        category_name_es: 'Problemas Técnicos',
        category_name_fr: 'Problèmes Techniques',
        category_name_de: 'Technische Probleme',
        category_name_ko: '기술 문제',
        category_name_ar: 'مشاكل تقنية',
        category_name_pt: 'Problemas Técnicos',
        helpful_count: 5,
        not_helpful_count: 0
    }
];

// Export for use in faq.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = faqMultilingualData;
}
