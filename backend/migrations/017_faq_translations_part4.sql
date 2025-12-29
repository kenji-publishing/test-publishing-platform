-- =============================================
-- Phase 12-4e: FAQ追加翻訳 Part 4
-- 技術・その他FAQ (5件)
-- =============================================

-- FAQ: The page is not displaying correctly
UPDATE faq_items SET
    question_zh = '页面显示不正确',
    answer_zh = '请尝试以下操作：1) 清除浏览器缓存和Cookie，2) 禁用浏览器扩展，3) 尝试使用其他浏览器，4) 检查您的网络连接。如果问题仍然存在，请联系我们并提供您使用的浏览器和设备信息。',
    question_es = 'La página no se muestra correctamente',
    answer_es = 'Por favor intente lo siguiente: 1) Limpie la caché y las cookies del navegador, 2) Desactive las extensiones del navegador, 3) Pruebe con otro navegador, 4) Verifique su conexión a internet. Si el problema persiste, contáctenos con información sobre su navegador y dispositivo.',
    question_fr = 'La page ne s''affiche pas correctement',
    answer_fr = 'Veuillez essayer ce qui suit : 1) Videz le cache et les cookies du navigateur, 2) Désactivez les extensions du navigateur, 3) Essayez un autre navigateur, 4) Vérifiez votre connexion internet. Si le problème persiste, contactez-nous avec les informations sur votre navigateur et appareil.',
    question_de = 'Die Seite wird nicht richtig angezeigt',
    answer_de = 'Bitte versuchen Sie Folgendes: 1) Browser-Cache und Cookies löschen, 2) Browser-Erweiterungen deaktivieren, 3) Anderen Browser verwenden, 4) Internetverbindung prüfen. Wenn das Problem weiterhin besteht, kontaktieren Sie uns mit Informationen zu Ihrem Browser und Gerät.',
    question_ko = '페이지가 올바르게 표시되지 않습니다',
    answer_ko = '다음을 시도해 주세요: 1) 브라우저 캐시 및 쿠키 삭제, 2) 브라우저 확장 프로그램 비활성화, 3) 다른 브라우저 사용, 4) 인터넷 연결 확인. 문제가 계속되면 브라우저 및 기기 정보와 함께 문의해 주세요.',
    question_ar = 'الصفحة لا تظهر بشكل صحيح',
    answer_ar = 'يرجى تجربة ما يلي: 1) مسح ذاكرة التخزين المؤقت وملفات تعريف الارتباط للمتصفح، 2) تعطيل إضافات المتصفح، 3) تجربة متصفح آخر، 4) التحقق من اتصال الإنترنت. إذا استمرت المشكلة، اتصل بنا مع معلومات المتصفح والجهاز.',
    question_pt = 'A página não está sendo exibida corretamente',
    answer_pt = 'Por favor, tente o seguinte: 1) Limpe o cache e cookies do navegador, 2) Desative as extensões do navegador, 3) Tente outro navegador, 4) Verifique sua conexão com a internet. Se o problema persistir, entre em contato conosco com informações sobre seu navegador e dispositivo.'
WHERE question_en = 'The page is not displaying correctly';

-- FAQ: Upload gets stuck midway
UPDATE faq_items SET
    question_zh = '上传中途卡住了',
    answer_zh = '上传问题通常由网络连接引起。请尝试：1) 检查网络连接，2) 使用较小的文件（最大50MB），3) 避免在网络繁忙时段上传，4) 尝试使用有线连接而非Wi-Fi。如果问题持续，请联系支持团队。',
    question_es = 'La carga se detiene a mitad de camino',
    answer_es = 'Los problemas de carga generalmente son causados por la conexión de red. Por favor intente: 1) Verificar la conexión de red, 2) Usar archivos más pequeños (máximo 50MB), 3) Evitar cargar durante horas pico, 4) Usar conexión por cable en lugar de Wi-Fi. Si el problema persiste, contacte al soporte.',
    question_fr = 'Le téléchargement se bloque en cours de route',
    answer_fr = 'Les problèmes de téléchargement sont généralement causés par la connexion réseau. Veuillez essayer : 1) Vérifier la connexion réseau, 2) Utiliser des fichiers plus petits (max 50 Mo), 3) Éviter de télécharger aux heures de pointe, 4) Utiliser une connexion filaire au lieu du Wi-Fi. Si le problème persiste, contactez le support.',
    question_de = 'Upload bleibt mittendrin hängen',
    answer_de = 'Upload-Probleme werden normalerweise durch die Netzwerkverbindung verursacht. Bitte versuchen Sie: 1) Netzwerkverbindung prüfen, 2) Kleinere Dateien verwenden (max. 50 MB), 3) Upload außerhalb der Stoßzeiten, 4) Kabelverbindung statt WLAN verwenden. Bei anhaltenden Problemen kontaktieren Sie den Support.',
    question_ko = '업로드가 중간에 멈춥니다',
    answer_ko = '업로드 문제는 보통 네트워크 연결로 인해 발생합니다. 다음을 시도해 주세요: 1) 네트워크 연결 확인, 2) 작은 파일 사용(최대 50MB), 3) 피크 시간 업로드 피하기, 4) Wi-Fi 대신 유선 연결 사용. 문제가 계속되면 지원팀에 문의하세요.',
    question_ar = 'التحميل يتوقف في منتصف الطريق',
    answer_ar = 'عادة ما تكون مشاكل التحميل ناتجة عن اتصال الشبكة. يرجى تجربة: 1) التحقق من اتصال الشبكة، 2) استخدام ملفات أصغر (الحد الأقصى 50 ميجابايت)، 3) تجنب التحميل خلال ساعات الذروة، 4) استخدام اتصال سلكي بدلاً من Wi-Fi. إذا استمرت المشكلة، اتصل بالدعم.',
    question_pt = 'O upload para no meio do caminho',
    answer_pt = 'Problemas de upload geralmente são causados pela conexão de rede. Por favor, tente: 1) Verificar a conexão de rede, 2) Usar arquivos menores (máximo 50MB), 3) Evitar upload em horários de pico, 4) Usar conexão com fio em vez de Wi-Fi. Se o problema persistir, entre em contato com o suporte.'
WHERE question_en = 'Upload gets stuck midway';

-- FAQ: I am not receiving notification emails
UPDATE faq_items SET
    question_zh = '我收不到通知邮件',
    answer_zh = '请检查以下几点：1) 查看垃圾邮件/促销邮件文件夹，2) 确认邮箱地址正确，3) 将 noreply@publisher.com 添加到联系人，4) 在设置中检查通知偏好。如果问题仍然存在，请联系支持团队。',
    question_es = 'No estoy recibiendo correos de notificación',
    answer_es = 'Por favor verifique lo siguiente: 1) Revise su carpeta de spam/promociones, 2) Confirme que su dirección de correo es correcta, 3) Agregue noreply@publisher.com a sus contactos, 4) Verifique las preferencias de notificación en configuración. Si el problema persiste, contacte al soporte.',
    question_fr = 'Je ne reçois pas les e-mails de notification',
    answer_fr = 'Veuillez vérifier les points suivants : 1) Vérifiez votre dossier spam/promotions, 2) Confirmez que votre adresse e-mail est correcte, 3) Ajoutez noreply@publisher.com à vos contacts, 4) Vérifiez vos préférences de notification dans les paramètres. Si le problème persiste, contactez le support.',
    question_de = 'Ich erhalte keine Benachrichtigungs-E-Mails',
    answer_de = 'Bitte überprüfen Sie Folgendes: 1) Spam-/Werbeordner prüfen, 2) E-Mail-Adresse bestätigen, 3) noreply@publisher.com zu Kontakten hinzufügen, 4) Benachrichtigungseinstellungen in den Einstellungen prüfen. Wenn das Problem weiterhin besteht, kontaktieren Sie den Support.',
    question_ko = '알림 이메일을 받지 못하고 있습니다',
    answer_ko = '다음을 확인해 주세요: 1) 스팸/프로모션 폴더 확인, 2) 이메일 주소가 올바른지 확인, 3) noreply@publisher.com을 연락처에 추가, 4) 설정에서 알림 기본 설정 확인. 문제가 계속되면 지원팀에 문의하세요.',
    question_ar = 'لا أتلقى رسائل البريد الإلكتروني للإشعارات',
    answer_ar = 'يرجى التحقق مما يلي: 1) تحقق من مجلد البريد العشوائي/الترويجي، 2) تأكد من صحة عنوان بريدك الإلكتروني، 3) أضف noreply@publisher.com إلى جهات الاتصال، 4) تحقق من تفضيلات الإشعارات في الإعدادات. إذا استمرت المشكلة، اتصل بالدعم.',
    question_pt = 'Não estou recebendo e-mails de notificação',
    answer_pt = 'Por favor, verifique o seguinte: 1) Verifique sua pasta de spam/promoções, 2) Confirme se seu endereço de e-mail está correto, 3) Adicione noreply@publisher.com aos seus contatos, 4) Verifique as preferências de notificação nas configurações. Se o problema persistir, entre em contato com o suporte.'
WHERE question_en = 'I am not receiving notification emails';

-- FAQ: What languages does Publisher support?
UPDATE faq_items SET
    question_zh = 'Publisher支持哪些语言？',
    answer_zh = '我们的平台界面支持9种语言：英语、日语、中文、西班牙语、法语、德语、韩语、阿拉伯语和葡萄牙语。翻译服务支持更多语言对。',
    question_es = '¿Qué idiomas soporta Publisher?',
    answer_es = 'Nuestra interfaz de plataforma está disponible en 9 idiomas: inglés, japonés, chino, español, francés, alemán, coreano, árabe y portugués. Los servicios de traducción soportan más pares de idiomas.',
    question_fr = 'Quelles langues Publisher prend-il en charge ?',
    answer_fr = 'Notre interface de plateforme est disponible en 9 langues : anglais, japonais, chinois, espagnol, français, allemand, coréen, arabe et portugais. Les services de traduction prennent en charge davantage de paires de langues.',
    question_de = 'Welche Sprachen unterstützt Publisher?',
    answer_de = 'Unsere Plattform-Oberfläche ist in 9 Sprachen verfügbar: Englisch, Japanisch, Chinesisch, Spanisch, Französisch, Deutsch, Koreanisch, Arabisch und Portugiesisch. Übersetzungsdienste unterstützen weitere Sprachpaare.',
    question_ko = 'Publisher는 어떤 언어를 지원하나요?',
    answer_ko = '플랫폼 인터페이스는 9개 언어를 지원합니다: 영어, 일본어, 중국어, 스페인어, 프랑스어, 독일어, 한국어, 아랍어, 포르투갈어. 번역 서비스는 더 많은 언어 쌍을 지원합니다.',
    question_ar = 'ما اللغات التي يدعمها Publisher؟',
    answer_ar = 'واجهة منصتنا متاحة بـ 9 لغات: الإنجليزية واليابانية والصينية والإسبانية والفرنسية والألمانية والكورية والعربية والبرتغالية. تدعم خدمات الترجمة المزيد من أزواج اللغات.',
    question_pt = 'Quais idiomas o Publisher suporta?',
    answer_pt = 'Nossa interface de plataforma está disponível em 9 idiomas: inglês, japonês, chinês, espanhol, francês, alemão, coreano, árabe e português. Os serviços de tradução suportam mais pares de idiomas.'
WHERE question_en = 'What languages does Publisher support?';

-- FAQ: How can I send feedback or feature requests?
UPDATE faq_items SET
    question_zh = '如何发送反馈或功能请求？',
    answer_zh = '我们欢迎您的反馈！您可以通过以下方式提交：1) 使用此页面的联系表单，2) 通过支持票系统，3) 发送邮件至 feedback@publisher.com。我们会审阅所有反馈并在产品开发中考虑。',
    question_es = '¿Cómo puedo enviar comentarios o solicitudes de funciones?',
    answer_es = '¡Agradecemos sus comentarios! Puede enviarlos a través de: 1) El formulario de contacto en esta página, 2) El sistema de tickets de soporte, 3) Correo electrónico a feedback@publisher.com. Revisamos todos los comentarios y los consideramos en el desarrollo del producto.',
    question_fr = 'Comment puis-je envoyer des commentaires ou des demandes de fonctionnalités ?',
    answer_fr = 'Nous apprécions vos commentaires ! Vous pouvez les soumettre via : 1) Le formulaire de contact sur cette page, 2) Le système de tickets de support, 3) E-mail à feedback@publisher.com. Nous examinons tous les commentaires et les prenons en compte dans le développement du produit.',
    question_de = 'Wie kann ich Feedback oder Funktionsanfragen senden?',
    answer_de = 'Wir freuen uns über Ihr Feedback! Sie können es einreichen über: 1) Das Kontaktformular auf dieser Seite, 2) Das Support-Ticket-System, 3) E-Mail an feedback@publisher.com. Wir prüfen alle Rückmeldungen und berücksichtigen sie bei der Produktentwicklung.',
    question_ko = '피드백이나 기능 요청은 어떻게 보내나요?',
    answer_ko = '피드백을 환영합니다! 다음을 통해 제출할 수 있습니다: 1) 이 페이지의 문의 양식, 2) 지원 티켓 시스템, 3) feedback@publisher.com으로 이메일. 모든 피드백을 검토하고 제품 개발에 반영합니다.',
    question_ar = 'كيف يمكنني إرسال ملاحظات أو طلبات ميزات؟',
    answer_ar = 'نرحب بملاحظاتك! يمكنك إرسالها عبر: 1) نموذج الاتصال في هذه الصفحة، 2) نظام تذاكر الدعم، 3) البريد الإلكتروني إلى feedback@publisher.com. نراجع جميع الملاحظات ونأخذها في الاعتبار عند تطوير المنتج.',
    question_pt = 'Como posso enviar feedback ou solicitações de recursos?',
    answer_pt = 'Agradecemos seu feedback! Você pode enviá-lo através de: 1) O formulário de contato nesta página, 2) O sistema de tickets de suporte, 3) E-mail para feedback@publisher.com. Analisamos todos os feedbacks e os consideramos no desenvolvimento do produto.'
WHERE question_en = 'How can I send feedback or feature requests?';

-- 完了メッセージ
-- Phase 12-4e Part 4: 技術・その他FAQ 5件の翻訳完了
