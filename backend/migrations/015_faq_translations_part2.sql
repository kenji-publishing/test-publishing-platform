-- =============================================
-- Phase 12-4e: FAQ追加翻訳 Part 2
-- 作品・翻訳関連FAQ (7件)
-- =============================================

-- FAQ: Where can I read my purchased works?
UPDATE faq_items SET
    question_zh = '我在哪里可以阅读已购买的作品？',
    answer_zh = '您可以在仪表板的"我的书架"中找到所有已购买的作品。作品可以在线阅读，也可以下载到您的设备上离线阅读。',
    question_es = '¿Dónde puedo leer mis obras compradas?',
    answer_es = 'Puede encontrar todas sus obras compradas en "Mi biblioteca" en su panel. Las obras se pueden leer en línea o descargar a su dispositivo para lectura sin conexión.',
    question_fr = 'Où puis-je lire mes œuvres achetées ?',
    answer_fr = 'Vous pouvez trouver toutes vos œuvres achetées dans "Ma bibliothèque" sur votre tableau de bord. Les œuvres peuvent être lues en ligne ou téléchargées sur votre appareil pour une lecture hors ligne.',
    question_de = 'Wo kann ich meine gekauften Werke lesen?',
    answer_de = 'Sie finden alle Ihre gekauften Werke unter "Meine Bibliothek" in Ihrem Dashboard. Werke können online gelesen oder auf Ihr Gerät für das Offline-Lesen heruntergeladen werden.',
    question_ko = '구매한 작품은 어디에서 읽을 수 있나요?',
    answer_ko = '대시보드의 "내 서재"에서 구매한 모든 작품을 찾을 수 있습니다. 온라인으로 읽거나 오프라인 읽기를 위해 기기에 다운로드할 수 있습니다.',
    question_ar = 'أين يمكنني قراءة الأعمال التي اشتريتها؟',
    answer_ar = 'يمكنك العثور على جميع الأعمال التي اشتريتها في "مكتبتي" في لوحة التحكم. يمكن قراءة الأعمال عبر الإنترنت أو تنزيلها على جهازك للقراءة دون اتصال.',
    question_pt = 'Onde posso ler minhas obras compradas?',
    answer_pt = 'Você pode encontrar todas as suas obras compradas em "Minha biblioteca" no seu painel. As obras podem ser lidas online ou baixadas para seu dispositivo para leitura offline.'
WHERE question_en = 'Where can I read my purchased works?';

-- FAQ: Is there an expiration on downloaded works?
UPDATE faq_items SET
    question_zh = '下载的作品有有效期吗？',
    answer_zh = '一旦您购买了作品，就可以永久访问。下载的文件没有有效期限制。但是，如果您想在新设备上访问，需要重新从您的书架下载。',
    question_es = '¿Las obras descargadas tienen fecha de vencimiento?',
    answer_es = 'Una vez que compra una obra, tiene acceso permanente a ella. No hay límite de tiempo en los archivos descargados. Sin embargo, si desea acceder en un nuevo dispositivo, deberá volver a descargar desde su biblioteca.',
    question_fr = 'Les œuvres téléchargées ont-elles une date d\'expiration ?',
    answer_fr = 'Une fois que vous avez acheté une œuvre, vous y avez accès de façon permanente. Il n\'y a pas de limite de temps sur les fichiers téléchargés. Cependant, si vous souhaitez y accéder sur un nouvel appareil, vous devrez télécharger à nouveau depuis votre bibliothèque.',
    question_de = 'Haben heruntergeladene Werke ein Ablaufdatum?',
    answer_de = 'Sobald Sie ein Werk gekauft haben, haben Sie dauerhaften Zugang. Es gibt keine zeitliche Begrenzung für heruntergeladene Dateien. Wenn Sie jedoch auf einem neuen Gerät zugreifen möchten, müssen Sie es erneut aus Ihrer Bibliothek herunterladen.',
    question_ko = '다운로드한 작품에 만료 기간이 있나요?',
    answer_ko = '작품을 구매하면 영구적으로 접근할 수 있습니다. 다운로드한 파일에는 시간 제한이 없습니다. 다만, 새 기기에서 접근하려면 서재에서 다시 다운로드해야 합니다.',
    question_ar = 'هل تنتهي صلاحية الأعمال التي تم تنزيلها؟',
    answer_ar = 'بمجرد شراء عمل، يمكنك الوصول إليه بشكل دائم. لا يوجد حد زمني للملفات التي تم تنزيلها. ومع ذلك، إذا كنت ترغب في الوصول على جهاز جديد، ستحتاج إلى إعادة التنزيل من مكتبتك.',
    question_pt = 'As obras baixadas têm prazo de validade?',
    answer_pt = 'Uma vez que você compra uma obra, tem acesso permanente a ela. Não há limite de tempo nos arquivos baixados. No entanto, se quiser acessar em um novo dispositivo, precisará baixar novamente da sua biblioteca.'
WHERE question_en = 'Is there an expiration on downloaded works?';

-- FAQ: What file formats are supported?
UPDATE faq_items SET
    question_zh = '支持哪些文件格式？',
    answer_zh = '我们支持EPUB、PDF和MOBI格式的作品。阅读时，所有格式都可以在我们的在线阅读器中查看。下载时，您可以选择您喜欢的格式。',
    question_es = '¿Qué formatos de archivo son compatibles?',
    answer_es = 'Soportamos obras en formatos EPUB, PDF y MOBI. Al leer, todos los formatos se pueden ver en nuestro lector en línea. Al descargar, puede elegir su formato preferido.',
    question_fr = 'Quels formats de fichiers sont pris en charge ?',
    answer_fr = 'Nous prenons en charge les œuvres aux formats EPUB, PDF et MOBI. Lors de la lecture, tous les formats peuvent être visualisés dans notre lecteur en ligne. Lors du téléchargement, vous pouvez choisir votre format préféré.',
    question_de = 'Welche Dateiformate werden unterstützt?',
    answer_de = 'Wir unterstützen Werke in den Formaten EPUB, PDF und MOBI. Beim Lesen können alle Formate in unserem Online-Reader angezeigt werden. Beim Herunterladen können Sie Ihr bevorzugtes Format wählen.',
    question_ko = '어떤 파일 형식이 지원되나요?',
    answer_ko = 'EPUB, PDF, MOBI 형식의 작품을 지원합니다. 읽을 때는 모든 형식을 온라인 리더에서 볼 수 있습니다. 다운로드할 때는 원하는 형식을 선택할 수 있습니다.',
    question_ar = 'ما هي صيغ الملفات المدعومة؟',
    answer_ar = 'نحن ندعم الأعمال بصيغ EPUB و PDF و MOBI. عند القراءة، يمكن عرض جميع الصيغ في قارئنا عبر الإنترنت. عند التنزيل، يمكنك اختيار صيغتك المفضلة.',
    question_pt = 'Quais formatos de arquivo são suportados?',
    answer_pt = 'Suportamos obras nos formatos EPUB, PDF e MOBI. Ao ler, todos os formatos podem ser visualizados em nosso leitor online. Ao baixar, você pode escolher seu formato preferido.'
WHERE question_en = 'What file formats are supported?';

-- FAQ: How do I hire a translator directly?
UPDATE faq_items SET
    question_zh = '如何直接聘请翻译人员？',
    answer_zh = '在"翻译市场"页面，您可以按语言对、专业领域或评价来筛选翻译人员。查看翻译人员的个人资料、作品样本和评价后，点击"发送翻译请求"按钮直接联系。',
    question_es = '¿Cómo contrato a un traductor directamente?',
    answer_es = 'En la página "Mercado de traductores", puede filtrar traductores por par de idiomas, especialidad o calificaciones. Después de revisar el perfil, muestras de trabajo y reseñas de un traductor, haga clic en el botón "Enviar solicitud de traducción" para contactar directamente.',
    question_fr = 'Comment engager un traducteur directement ?',
    answer_fr = 'Sur la page "Marché des traducteurs", vous pouvez filtrer les traducteurs par paire de langues, spécialité ou évaluations. Après avoir consulté le profil, les échantillons de travail et les avis d\'un traducteur, cliquez sur le bouton "Envoyer une demande de traduction" pour contacter directement.',
    question_de = 'Wie beauftrage ich einen Übersetzer direkt?',
    answer_de = 'Auf der Seite "Übersetzer-Marktplatz" können Sie Übersetzer nach Sprachpaar, Fachgebiet oder Bewertungen filtern. Nachdem Sie das Profil, Arbeitsproben und Bewertungen eines Übersetzers geprüft haben, klicken Sie auf "Übersetzungsanfrage senden", um direkt Kontakt aufzunehmen.',
    question_ko = '번역가를 직접 고용하려면 어떻게 해야 하나요?',
    answer_ko = '"번역가 마켓" 페이지에서 언어 쌍, 전문 분야 또는 평점으로 번역가를 필터링할 수 있습니다. 번역가의 프로필, 작업 샘플 및 리뷰를 확인한 후 "번역 요청 보내기" 버튼을 클릭하여 직접 연락하세요.',
    question_ar = 'كيف أوظف مترجمًا مباشرة؟',
    answer_ar = 'في صفحة "سوق المترجمين"، يمكنك تصفية المترجمين حسب زوج اللغات أو التخصص أو التقييمات. بعد مراجعة الملف الشخصي للمترجم وعينات العمل والمراجعات، انقر على زر "إرسال طلب ترجمة" للتواصل مباشرة.',
    question_pt = 'Como contrato um tradutor diretamente?',
    answer_pt = 'Na página "Mercado de tradutores", você pode filtrar tradutores por par de idiomas, especialidade ou avaliações. Depois de revisar o perfil, amostras de trabalho e avaliações de um tradutor, clique no botão "Enviar solicitação de tradução" para entrar em contato diretamente.'
WHERE question_en = 'How do I hire a translator directly?';

-- FAQ: How many free AI translations do I get per month?
UPDATE faq_items SET
    question_zh = '每月可以获得多少次免费AI翻译？',
    answer_zh = '免费用户每月可获得5次AI翻译（最多1000字/次）。高级会员每月可获得50次翻译（最多5000字/次）。翻译次数每月1日重置。',
    question_es = '¿Cuántas traducciones de IA gratuitas obtengo al mes?',
    answer_es = 'Los usuarios gratuitos obtienen 5 traducciones de IA por mes (hasta 1,000 caracteres cada una). Los miembros premium obtienen 50 traducciones por mes (hasta 5,000 caracteres cada una). Los conteos se reinician el día 1 de cada mes.',
    question_fr = 'Combien de traductions IA gratuites ai-je par mois ?',
    answer_fr = 'Les utilisateurs gratuits bénéficient de 5 traductions IA par mois (jusqu\'à 1 000 caractères chacune). Les membres premium bénéficient de 50 traductions par mois (jusqu\'à 5 000 caractères chacune). Les compteurs sont réinitialisés le 1er de chaque mois.',
    question_de = 'Wie viele kostenlose KI-Übersetzungen bekomme ich pro Monat?',
    answer_de = 'Kostenlose Nutzer erhalten 5 KI-Übersetzungen pro Monat (bis zu 1.000 Zeichen pro Übersetzung). Premium-Mitglieder erhalten 50 Übersetzungen pro Monat (bis zu 5.000 Zeichen pro Übersetzung). Die Zähler werden am 1. jedes Monats zurückgesetzt.',
    question_ko = '한 달에 몇 번의 무료 AI 번역을 받을 수 있나요?',
    answer_ko = '무료 사용자는 월 5회 AI 번역(각 최대 1,000자)을 받을 수 있습니다. 프리미엄 회원은 월 50회 번역(각 최대 5,000자)을 받을 수 있습니다. 매월 1일에 횟수가 초기화됩니다.',
    question_ar = 'كم عدد ترجمات الذكاء الاصطناعي المجانية التي أحصل عليها شهريًا؟',
    answer_ar = 'يحصل المستخدمون المجانيون على 5 ترجمات ذكاء اصطناعي شهريًا (حتى 1000 حرف لكل منها). يحصل الأعضاء المميزون على 50 ترجمة شهريًا (حتى 5000 حرف لكل منها). يتم إعادة تعيين العدادات في اليوم الأول من كل شهر.',
    question_pt = 'Quantas traduções de IA gratuitas recebo por mês?',
    answer_pt = 'Usuários gratuitos recebem 5 traduções de IA por mês (até 1.000 caracteres cada). Membros premium recebem 50 traduções por mês (até 5.000 caracteres cada). As contagens são reiniciadas no dia 1º de cada mês.'
WHERE question_en LIKE 'How many free AI translations%' OR question_en LIKE 'How may free AI translations%';

-- FAQ: What if I am not satisfied with the translation quality?
UPDATE faq_items SET
    question_zh = '如果我对翻译质量不满意怎么办？',
    answer_zh = '对于AI翻译，您可以要求重新翻译或尝试不同的翻译设置。对于人工翻译，您可以在项目完成前请求修改。如果仍不满意，可以联系我们的支持团队进行调解。',
    question_es = '¿Qué pasa si no estoy satisfecho con la calidad de la traducción?',
    answer_es = 'Para traducciones de IA, puede solicitar una retraducción o probar diferentes configuraciones. Para traducciones humanas, puede solicitar revisiones antes de que se complete el proyecto. Si aún no está satisfecho, contacte a nuestro equipo de soporte para mediación.',
    question_fr = 'Que faire si je ne suis pas satisfait de la qualité de la traduction ?',
    answer_fr = 'Pour les traductions IA, vous pouvez demander une retraduction ou essayer différents paramètres. Pour les traductions humaines, vous pouvez demander des révisions avant la fin du projet. Si vous n\'êtes toujours pas satisfait, contactez notre équipe de support pour une médiation.',
    question_de = 'Was ist, wenn ich mit der Übersetzungsqualität nicht zufrieden bin?',
    answer_de = 'Bei KI-Übersetzungen können Sie eine erneute Übersetzung anfordern oder verschiedene Einstellungen ausprobieren. Bei menschlichen Übersetzungen können Sie vor Projektabschluss Überarbeitungen anfordern. Wenn Sie immer noch nicht zufrieden sind, kontaktieren Sie unser Support-Team zur Vermittlung.',
    question_ko = '번역 품질에 만족하지 못하면 어떻게 하나요?',
    answer_ko = 'AI 번역의 경우 재번역을 요청하거나 다른 설정을 시도할 수 있습니다. 인간 번역의 경우 프로젝트 완료 전에 수정을 요청할 수 있습니다. 여전히 만족하지 못하면 중재를 위해 지원팀에 문의하세요.',
    question_ar = 'ماذا لو لم أكن راضيًا عن جودة الترجمة؟',
    answer_ar = 'بالنسبة لترجمات الذكاء الاصطناعي، يمكنك طلب إعادة الترجمة أو تجربة إعدادات مختلفة. بالنسبة للترجمات البشرية، يمكنك طلب مراجعات قبل اكتمال المشروع. إذا كنت لا تزال غير راضٍ، اتصل بفريق الدعم للوساطة.',
    question_pt = 'E se eu não estiver satisfeito com a qualidade da tradução?',
    answer_pt = 'Para traduções de IA, você pode solicitar uma nova tradução ou experimentar diferentes configurações. Para traduções humanas, você pode solicitar revisões antes da conclusão do projeto. Se ainda não estiver satisfeito, entre em contato com nossa equipe de suporte para mediação.'
WHERE question_en = 'What if I am not satisfied with the translation quality?';

-- FAQ: How do I publish my work?
UPDATE faq_items SET
    question_zh = '如何发布我的作品？',
    answer_zh = '登录后，进入仪表板点击"发布新作品"。填写作品详情（标题、描述、类别），上传您的手稿文件，设置价格，然后提交审核。审核通过后，您的作品将在平台上发布。',
    question_es = '¿Cómo publico mi obra?',
    answer_es = 'Después de iniciar sesión, vaya a su panel y haga clic en "Publicar nueva obra". Complete los detalles de la obra (título, descripción, categoría), cargue su archivo de manuscrito, establezca el precio y envíe para revisión. Una vez aprobada, su obra se publicará en la plataforma.',
    question_fr = 'Comment publier mon œuvre ?',
    answer_fr = 'Après vous être connecté, accédez à votre tableau de bord et cliquez sur "Publier une nouvelle œuvre". Remplissez les détails de l\'œuvre (titre, description, catégorie), téléchargez votre fichier manuscrit, fixez le prix et soumettez pour examen. Une fois approuvée, votre œuvre sera publiée sur la plateforme.',
    question_de = 'Wie veröffentliche ich mein Werk?',
    answer_de = 'Gehen Sie nach der Anmeldung zu Ihrem Dashboard und klicken Sie auf "Neues Werk veröffentlichen". Füllen Sie die Werkdetails aus (Titel, Beschreibung, Kategorie), laden Sie Ihre Manuskriptdatei hoch, legen Sie den Preis fest und reichen Sie zur Prüfung ein. Nach Genehmigung wird Ihr Werk auf der Plattform veröffentlicht.',
    question_ko = '작품을 어떻게 출판하나요?',
    answer_ko = '로그인 후 대시보드에서 "새 작품 출판"을 클릭합니다. 작품 세부 정보(제목, 설명, 카테고리)를 입력하고 원고 파일을 업로드한 다음 가격을 설정하고 검토를 위해 제출합니다. 승인되면 작품이 플랫폼에 게시됩니다.',
    question_ar = 'كيف أنشر عملي؟',
    answer_ar = 'بعد تسجيل الدخول، انتقل إلى لوحة التحكم وانقر على "نشر عمل جديد". املأ تفاصيل العمل (العنوان والوصف والفئة)، وحمّل ملف مخطوطتك، وحدد السعر، وأرسل للمراجعة. بمجرد الموافقة، سيتم نشر عملك على المنصة.',
    question_pt = 'Como publico minha obra?',
    answer_pt = 'Após fazer login, vá ao seu painel e clique em "Publicar nova obra". Preencha os detalhes da obra (título, descrição, categoria), faça upload do arquivo do manuscrito, defina o preço e envie para revisão. Uma vez aprovada, sua obra será publicada na plataforma.'
WHERE question_en = 'How do I publish my work?';

-- 完了メッセージ
-- Phase 12-4e Part 2: 作品・翻訳関連FAQ 7件の翻訳完了
