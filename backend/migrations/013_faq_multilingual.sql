-- =============================================
-- Phase 12-4d: FAQ多言語対応
-- 9言語対応（en, ja, zh, es, fr, de, ko, ar, pt）
-- =============================================

-- ---------------------------------------------
-- 1. FAQカテゴリテーブルに言語カラム追加
-- ---------------------------------------------

-- 中国語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_zh VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_zh TEXT;

-- スペイン語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_es VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_es TEXT;

-- フランス語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_fr VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_fr TEXT;

-- ドイツ語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_de VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_de TEXT;

-- 韓国語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_ko VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_ko TEXT;

-- アラビア語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_ar VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- ポルトガル語
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_pt VARCHAR(100);
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS description_pt TEXT;

-- ---------------------------------------------
-- 2. FAQ項目テーブルに言語カラム追加
-- ---------------------------------------------

-- 中国語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_zh TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_zh TEXT;

-- スペイン語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_es TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_es TEXT;

-- フランス語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_fr TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_fr TEXT;

-- ドイツ語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_de TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_de TEXT;

-- 韓国語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_ko TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_ko TEXT;

-- アラビア語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_ar TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_ar TEXT;

-- ポルトガル語
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_pt TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_pt TEXT;

-- ---------------------------------------------
-- 3. カテゴリ翻訳データ更新
-- ---------------------------------------------

UPDATE faq_categories SET
    name_zh = CASE id
        WHEN 1 THEN '账户'
        WHEN 2 THEN '付款'
        WHEN 3 THEN '作品'
        WHEN 4 THEN '翻译服务'
        WHEN 5 THEN '作者专区'
        WHEN 6 THEN '译者专区'
        WHEN 7 THEN '技术问题'
        WHEN 8 THEN '其他'
    END,
    name_es = CASE id
        WHEN 1 THEN 'Cuenta'
        WHEN 2 THEN 'Pago'
        WHEN 3 THEN 'Obras'
        WHEN 4 THEN 'Traducción'
        WHEN 5 THEN 'Para Autores'
        WHEN 6 THEN 'Para Traductores'
        WHEN 7 THEN 'Problemas Técnicos'
        WHEN 8 THEN 'Otros'
    END,
    name_fr = CASE id
        WHEN 1 THEN 'Compte'
        WHEN 2 THEN 'Paiement'
        WHEN 3 THEN 'Œuvres'
        WHEN 4 THEN 'Traduction'
        WHEN 5 THEN 'Pour les Auteurs'
        WHEN 6 THEN 'Pour les Traducteurs'
        WHEN 7 THEN 'Problèmes Techniques'
        WHEN 8 THEN 'Autres'
    END,
    name_de = CASE id
        WHEN 1 THEN 'Konto'
        WHEN 2 THEN 'Zahlung'
        WHEN 3 THEN 'Werke'
        WHEN 4 THEN 'Übersetzung'
        WHEN 5 THEN 'Für Autoren'
        WHEN 6 THEN 'Für Übersetzer'
        WHEN 7 THEN 'Technische Probleme'
        WHEN 8 THEN 'Sonstiges'
    END,
    name_ko = CASE id
        WHEN 1 THEN '계정'
        WHEN 2 THEN '결제'
        WHEN 3 THEN '작품'
        WHEN 4 THEN '번역 서비스'
        WHEN 5 THEN '저자용'
        WHEN 6 THEN '번역가용'
        WHEN 7 THEN '기술 문제'
        WHEN 8 THEN '기타'
    END,
    name_ar = CASE id
        WHEN 1 THEN 'الحساب'
        WHEN 2 THEN 'الدفع'
        WHEN 3 THEN 'الأعمال'
        WHEN 4 THEN 'الترجمة'
        WHEN 5 THEN 'للمؤلفين'
        WHEN 6 THEN 'للمترجمين'
        WHEN 7 THEN 'مشاكل تقنية'
        WHEN 8 THEN 'أخرى'
    END,
    name_pt = CASE id
        WHEN 1 THEN 'Conta'
        WHEN 2 THEN 'Pagamento'
        WHEN 3 THEN 'Obras'
        WHEN 4 THEN 'Tradução'
        WHEN 5 THEN 'Para Autores'
        WHEN 6 THEN 'Para Tradutores'
        WHEN 7 THEN 'Problemas Técnicos'
        WHEN 8 THEN 'Outros'
    END
WHERE id <= 8;

-- ---------------------------------------------
-- 4. FAQ項目翻訳データ更新（ID 1-3: アカウント関連）
-- ---------------------------------------------

-- FAQ 1: アカウント作成
UPDATE faq_items SET
    question_zh = '如何创建账户？',
    answer_zh = '点击首页右上角的"注册"按钮，输入您的电子邮件地址和密码。如果您想以作者、译者或编辑身份注册，请使用各角色专用的注册页面。',
    question_es = '¿Cómo creo una cuenta?',
    answer_es = 'Haga clic en el botón "Registrarse" en la esquina superior derecha de la página de inicio e ingrese su correo electrónico y contraseña. Si desea registrarse como autor, traductor o editor, utilice la página de registro dedicada para cada rol.',
    question_fr = 'Comment créer un compte ?',
    answer_fr = 'Cliquez sur le bouton "S''inscrire" en haut à droite de la page d''accueil et entrez votre adresse e-mail et mot de passe. Si vous souhaitez vous inscrire en tant qu''auteur, traducteur ou éditeur, veuillez utiliser la page d''inscription dédiée.',
    question_de = 'Wie erstelle ich ein Konto?',
    answer_de = 'Klicken Sie oben rechts auf der Startseite auf "Registrieren" und geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein. Wenn Sie sich als Autor, Übersetzer oder Redakteur registrieren möchten, nutzen Sie bitte die entsprechende Registrierungsseite.',
    question_ko = '계정을 만들려면 어떻게 해야 하나요?',
    answer_ko = '홈페이지 오른쪽 상단의 "회원가입" 버튼을 클릭하고 이메일 주소와 비밀번호를 입력하세요. 저자, 번역가 또는 편집자로 등록하려면 각 역할별 전용 등록 페이지를 이용해 주세요.',
    question_ar = 'كيف أنشئ حسابًا؟',
    answer_ar = 'انقر على زر "التسجيل" في الزاوية العلوية اليمنى من الصفحة الرئيسية وأدخل بريدك الإلكتروني وكلمة المرور. إذا كنت ترغب في التسجيل كمؤلف أو مترجم أو محرر، يرجى استخدام صفحة التسجيل المخصصة لكل دور.',
    question_pt = 'Como crio uma conta?',
    answer_pt = 'Clique no botão "Cadastrar" no canto superior direito da página inicial e insira seu e-mail e senha. Se você deseja se registrar como autor, tradutor ou editor, use a página de registro dedicada para cada função.'
WHERE id = 1;

-- FAQ 2: パスワード忘れ
UPDATE faq_items SET
    question_zh = '我忘记了密码',
    answer_zh = '点击登录页面上的"忘记密码？"链接，输入您注册时的电子邮件地址。我们将通过电子邮件向您发送密码重置链接。',
    question_es = 'Olvidé mi contraseña',
    answer_es = 'Haga clic en el enlace "¿Olvidó su contraseña?" en la página de inicio de sesión e ingrese su correo electrónico registrado. Le enviaremos un enlace para restablecer la contraseña.',
    question_fr = 'J''ai oublié mon mot de passe',
    answer_fr = 'Cliquez sur le lien "Mot de passe oublié ?" sur la page de connexion et entrez votre adresse e-mail enregistrée. Nous vous enverrons un lien de réinitialisation par e-mail.',
    question_de = 'Ich habe mein Passwort vergessen',
    answer_de = 'Klicken Sie auf der Anmeldeseite auf "Passwort vergessen?" und geben Sie Ihre registrierte E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen des Passworts per E-Mail.',
    question_ko = '비밀번호를 잊어버렸습니다',
    answer_ko = '로그인 페이지에서 "비밀번호를 잊으셨나요?" 링크를 클릭하고 등록된 이메일 주소를 입력하세요. 비밀번호 재설정 링크를 이메일로 보내드립니다.',
    question_ar = 'نسيت كلمة المرور',
    answer_ar = 'انقر على رابط "نسيت كلمة المرور؟" في صفحة تسجيل الدخول وأدخل بريدك الإلكتروني المسجل. سنرسل لك رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني.',
    question_pt = 'Esqueci minha senha',
    answer_pt = 'Clique no link "Esqueceu a senha?" na página de login e insira seu e-mail cadastrado. Enviaremos um link para redefinir a senha por e-mail.'
WHERE id = 2;

-- FAQ 3: メールアドレス変更
UPDATE faq_items SET
    question_zh = '我想更改我的电子邮件地址',
    answer_zh = '您可以从仪表板的"设置"→"账户设置"中更改。确认邮件将发送到您的新电子邮件地址，请点击链接完成更改。',
    question_es = 'Quiero cambiar mi dirección de correo electrónico',
    answer_es = 'Puede cambiarlo desde "Configuración" → "Configuración de cuenta" en su panel. Se enviará un correo de confirmación a su nueva dirección. Haga clic en el enlace para completar el cambio.',
    question_fr = 'Je veux changer mon adresse e-mail',
    answer_fr = 'Vous pouvez la modifier depuis "Paramètres" → "Paramètres du compte" dans votre tableau de bord. Un e-mail de confirmation sera envoyé à votre nouvelle adresse. Cliquez sur le lien pour terminer.',
    question_de = 'Ich möchte meine E-Mail-Adresse ändern',
    answer_de = 'Sie können sie unter "Einstellungen" → "Kontoeinstellungen" in Ihrem Dashboard ändern. Eine Bestätigungs-E-Mail wird an Ihre neue Adresse gesendet. Klicken Sie auf den Link, um die Änderung abzuschließen.',
    question_ko = '이메일 주소를 변경하고 싶습니다',
    answer_ko = '대시보드의 "설정" → "계정 설정"에서 변경할 수 있습니다. 새 이메일 주소로 확인 이메일이 발송되며, 링크를 클릭하여 변경을 완료하세요.',
    question_ar = 'أريد تغيير عنوان بريدي الإلكتروني',
    answer_ar = 'يمكنك تغييره من "الإعدادات" → "إعدادات الحساب" في لوحة التحكم. سيتم إرسال بريد تأكيد إلى عنوانك الجديد. انقر على الرابط لإكمال التغيير.',
    question_pt = 'Quero alterar meu endereço de e-mail',
    answer_pt = 'Você pode alterá-lo em "Configurações" → "Configurações da conta" no seu painel. Um e-mail de confirmação será enviado para o novo endereço. Clique no link para concluir a alteração.'
WHERE id = 3;

-- ---------------------------------------------
-- 5. FAQ項目翻訳データ更新（ID 4-5: 支払い関連）
-- ---------------------------------------------

-- FAQ 4: 支払い方法
UPDATE faq_items SET
    question_zh = '可用的支付方式有哪些？',
    answer_zh = '我们接受信用卡（Visa、Mastercard、American Express）和PayPal。',
    question_es = '¿Qué métodos de pago están disponibles?',
    answer_es = 'Aceptamos tarjetas de crédito (Visa, Mastercard, American Express) y PayPal.',
    question_fr = 'Quels modes de paiement sont disponibles ?',
    answer_fr = 'Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et PayPal.',
    question_de = 'Welche Zahlungsmethoden sind verfügbar?',
    answer_de = 'Wir akzeptieren Kreditkarten (Visa, Mastercard, American Express) und PayPal.',
    question_ko = '어떤 결제 방법을 사용할 수 있나요?',
    answer_ko = '신용카드(Visa, Mastercard, American Express)와 PayPal을 사용할 수 있습니다.',
    question_ar = 'ما هي طرق الدفع المتاحة؟',
    answer_ar = 'نقبل بطاقات الائتمان (Visa و Mastercard و American Express) و PayPal.',
    question_pt = 'Quais métodos de pagamento estão disponíveis?',
    answer_pt = 'Aceitamos cartões de crédito (Visa, Mastercard, American Express) e PayPal.'
WHERE id = 4;

-- FAQ 5: 返金
UPDATE faq_items SET
    question_zh = '如何申请退款？',
    answer_zh = '如果在购买后7天内，您可以从仪表板的"购买历史"提交退款申请。但是，如果您已经阅读了作品的50%以上，则不符合退款条件。',
    question_es = '¿Cómo solicito un reembolso?',
    answer_es = 'Si está dentro de los 7 días posteriores a la compra, puede enviar una solicitud de reembolso desde "Historial de compras" en su panel. Sin embargo, si ha visto más del 50% de la obra, no es elegible para reembolso.',
    question_fr = 'Comment demander un remboursement ?',
    answer_fr = 'Si vous êtes dans les 7 jours suivant l''achat, vous pouvez soumettre une demande de remboursement depuis "Historique des achats" sur votre tableau de bord. Cependant, si vous avez consulté plus de 50% de l''œuvre, le remboursement n''est pas possible.',
    question_de = 'Wie beantrage ich eine Rückerstattung?',
    answer_de = 'Innerhalb von 7 Tagen nach dem Kauf können Sie über "Kaufhistorie" in Ihrem Dashboard eine Rückerstattung beantragen. Wenn Sie jedoch mehr als 50% des Werkes angesehen haben, ist keine Rückerstattung möglich.',
    question_ko = '환불을 요청하려면 어떻게 해야 하나요?',
    answer_ko = '구매 후 7일 이내라면 대시보드의 "구매 내역"에서 환불 요청을 제출할 수 있습니다. 단, 작품의 50% 이상을 열람한 경우에는 환불 대상이 아닙니다.',
    question_ar = 'كيف أطلب استرداد المبلغ؟',
    answer_ar = 'إذا كنت خلال 7 أيام من الشراء، يمكنك تقديم طلب استرداد من "سجل المشتريات" في لوحة التحكم. ومع ذلك، إذا كنت قد شاهدت أكثر من 50% من العمل، فلن تكون مؤهلاً للاسترداد.',
    question_pt = 'Como solicito um reembolso?',
    answer_pt = 'Se estiver dentro de 7 dias após a compra, você pode enviar uma solicitação de reembolso em "Histórico de compras" no seu painel. No entanto, se você visualizou mais de 50% da obra, não é elegível para reembolso.'
WHERE id = 5;

-- ---------------------------------------------
-- 6. FAQ項目翻訳データ更新（ID 6-7: 翻訳関連）
-- ---------------------------------------------

-- FAQ 6: AI翻訳精度
UPDATE faq_items SET
    question_zh = 'AI翻译的准确度如何？',
    answer_zh = 'AI翻译使用先进的机器学习模型，可以高精度翻译一般文本。但是，对于专业术语或文学表达，我们建议使用专业翻译人员的翻译。',
    question_es = '¿Qué tan precisa es la traducción por IA?',
    answer_es = 'La traducción por IA utiliza modelos avanzados de aprendizaje automático y puede traducir texto general con alta precisión. Sin embargo, para términos técnicos o expresiones literarias, recomendamos la traducción por traductores profesionales.',
    question_fr = 'Quelle est la précision de la traduction IA ?',
    answer_fr = 'La traduction IA utilise des modèles d''apprentissage automatique avancés et peut traduire du texte général avec une grande précision. Cependant, pour les termes techniques ou les expressions littéraires, nous recommandons la traduction par des traducteurs professionnels.',
    question_de = 'Wie genau ist die KI-Übersetzung?',
    answer_de = 'Die KI-Übersetzung verwendet fortschrittliche Machine-Learning-Modelle und kann allgemeine Texte mit hoher Genauigkeit übersetzen. Für Fachbegriffe oder literarische Ausdrücke empfehlen wir jedoch die Übersetzung durch professionelle Übersetzer.',
    question_ko = 'AI 번역의 정확도는 어떤가요?',
    answer_ko = 'AI 번역은 고급 머신러닝 모델을 사용하여 일반 텍스트를 높은 정확도로 번역할 수 있습니다. 다만 전문 용어나 문학적 표현의 경우 전문 번역가의 번역을 권장합니다.',
    question_ar = 'ما مدى دقة الترجمة بالذكاء الاصطناعي؟',
    answer_ar = 'تستخدم الترجمة بالذكاء الاصطناعي نماذج تعلم آلي متقدمة ويمكنها ترجمة النص العام بدقة عالية. ومع ذلك، للمصطلحات التقنية أو التعبيرات الأدبية، نوصي بالترجمة من قبل مترجمين محترفين.',
    question_pt = 'Qual é a precisão da tradução por IA?',
    answer_pt = 'A tradução por IA usa modelos avançados de aprendizado de máquina e pode traduzir texto geral com alta precisão. No entanto, para termos técnicos ou expressões literárias, recomendamos a tradução por tradutores profissionais.'
WHERE id = 6;

-- FAQ 7: 翻訳者依頼
UPDATE faq_items SET
    question_zh = '如何直接联系翻译人员？',
    answer_zh = '在"寻找翻译"页面，您可以按语言对或专业领域搜索翻译人员。查看感兴趣的翻译人员资料后，点击"请求翻译"按钮提交申请表。',
    question_es = '¿Cómo solicito directamente a un traductor?',
    answer_es = 'Desde la página "Buscar Traductores", puede buscar traductores por par de idiomas o especialidad. Revise el perfil del traductor que le interese y envíe un formulario de solicitud usando el botón "Solicitar Traducción".',
    question_fr = 'Comment contacter directement un traducteur ?',
    answer_fr = 'Depuis la page "Trouver des traducteurs", vous pouvez rechercher des traducteurs par paire de langues ou spécialité. Consultez le profil d''un traducteur qui vous intéresse et soumettez une demande via le bouton "Demander une traduction".',
    question_de = 'Wie kontaktiere ich einen Übersetzer direkt?',
    answer_de = 'Auf der Seite "Übersetzer finden" können Sie nach Sprachpaar oder Fachgebiet suchen. Sehen Sie sich das Profil eines interessanten Übersetzers an und senden Sie über die Schaltfläche "Übersetzung anfordern" eine Anfrage.',
    question_ko = '번역가에게 직접 의뢰하려면 어떻게 해야 하나요?',
    answer_ko = '"번역가 찾기" 페이지에서 언어 쌍이나 전문 분야로 번역가를 검색할 수 있습니다. 관심 있는 번역가의 프로필을 확인한 후 "번역 요청" 버튼을 클릭하여 요청서를 제출하세요.',
    question_ar = 'كيف أطلب من مترجم مباشرة؟',
    answer_ar = 'من صفحة "البحث عن مترجمين"، يمكنك البحث عن مترجمين حسب زوج اللغات أو التخصص. راجع ملف المترجم الذي يثير اهتمامك وأرسل نموذج طلب باستخدام زر "طلب ترجمة".',
    question_pt = 'Como solicito diretamente a um tradutor?',
    answer_pt = 'Na página "Encontrar Tradutores", você pode pesquisar tradutores por par de idiomas ou especialidade. Confira o perfil de um tradutor de interesse e envie um formulário de solicitação usando o botão "Solicitar Tradução".'
WHERE id = 7;

-- ---------------------------------------------
-- 7. FAQ項目翻訳データ更新（ID 8-9: 技術関連）
-- ---------------------------------------------

-- FAQ 8: 作品が表示されない
UPDATE faq_items SET
    question_zh = '作品无法显示',
    answer_zh = '请尝试以下操作：1) 清除浏览器缓存，2) 尝试使用其他浏览器，3) 检查网络连接。如果问题持续存在，请联系我们。',
    question_es = 'La obra no se muestra',
    answer_es = 'Por favor intente lo siguiente: 1) Limpie la caché del navegador, 2) Pruebe con otro navegador, 3) Verifique su conexión a internet. Si el problema persiste, contáctenos.',
    question_fr = 'L''œuvre ne s''affiche pas',
    answer_fr = 'Veuillez essayer ce qui suit : 1) Videz le cache de votre navigateur, 2) Essayez un autre navigateur, 3) Vérifiez votre connexion internet. Si le problème persiste, contactez-nous.',
    question_de = 'Das Werk wird nicht angezeigt',
    answer_de = 'Bitte versuchen Sie Folgendes: 1) Browser-Cache leeren, 2) Anderen Browser verwenden, 3) Internetverbindung prüfen. Wenn das Problem weiterhin besteht, kontaktieren Sie uns.',
    question_ko = '작품이 표시되지 않습니다',
    answer_ko = '다음을 시도해 주세요: 1) 브라우저 캐시 삭제, 2) 다른 브라우저 사용, 3) 인터넷 연결 확인. 문제가 계속되면 문의해 주세요.',
    question_ar = 'العمل لا يظهر',
    answer_ar = 'يرجى تجربة ما يلي: 1) مسح ذاكرة التخزين المؤقت للمتصفح، 2) تجربة متصفح آخر، 3) التحقق من اتصال الإنترنت. إذا استمرت المشكلة، يرجى الاتصال بنا.',
    question_pt = 'A obra não está sendo exibida',
    answer_pt = 'Por favor, tente o seguinte: 1) Limpe o cache do navegador, 2) Tente outro navegador, 3) Verifique sua conexão com a internet. Se o problema persistir, entre em contato conosco.'
WHERE id = 8;

-- FAQ 9: 推奨ブラウザ
UPDATE faq_items SET
    question_zh = '推荐使用什么浏览器？',
    answer_zh = '我们推荐使用最新版本的Google Chrome、Firefox、Safari和Microsoft Edge。不支持Internet Explorer。',
    question_es = '¿Cuál es el navegador recomendado?',
    answer_es = 'Recomendamos las últimas versiones de Google Chrome, Firefox, Safari y Microsoft Edge. Internet Explorer no es compatible.',
    question_fr = 'Quel est le navigateur recommandé ?',
    answer_fr = 'Nous recommandons les dernières versions de Google Chrome, Firefox, Safari et Microsoft Edge. Internet Explorer n''est pas pris en charge.',
    question_de = 'Welcher Browser wird empfohlen?',
    answer_de = 'Wir empfehlen die neuesten Versionen von Google Chrome, Firefox, Safari und Microsoft Edge. Internet Explorer wird nicht unterstützt.',
    question_ko = '권장 브라우저는 무엇인가요?',
    answer_ko = 'Google Chrome, Firefox, Safari, Microsoft Edge의 최신 버전을 권장합니다. Internet Explorer는 지원하지 않습니다.',
    question_ar = 'ما هو المتصفح الموصى به؟',
    answer_ar = 'نوصي بأحدث إصدارات Google Chrome و Firefox و Safari و Microsoft Edge. لا يتم دعم Internet Explorer.',
    question_pt = 'Qual é o navegador recomendado?',
    answer_pt = 'Recomendamos as versões mais recentes do Google Chrome, Firefox, Safari e Microsoft Edge. O Internet Explorer não é suportado.'
WHERE id = 9;

-- ---------------------------------------------
-- 完了メッセージ
-- ---------------------------------------------
-- Phase 12-4d: FAQ多言語対応マイグレーション完了
-- 
-- 追加されたカラム:
-- faq_categories: name_zh/es/fr/de/ko/ar/pt, description_zh/es/fr/de/ko/ar/pt
-- faq_items: question_zh/es/fr/de/ko/ar/pt, answer_zh/es/fr/de/ko/ar/pt
--
-- 更新されたデータ:
-- - 8カテゴリの7言語翻訳
-- - 9FAQ項目の7言語翻訳
