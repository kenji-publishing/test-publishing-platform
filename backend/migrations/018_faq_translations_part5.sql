-- =============================================
-- Phase 12-4e: FAQ追加翻訳 Part 5
-- 残り2件のFAQ翻訳
-- =============================================

-- FAQ: How do I read on other devices?
UPDATE faq_items SET
    question_ja = '他のデバイスで読むにはどうすればいいですか？',
    answer_ja = 'お使いのアカウントでログインすれば、どのデバイスからでも購入した作品にアクセスできます。Webブラウザ、iOSアプリ、Androidアプリに対応しています。読書の進捗は自動的に同期されます。',
    question_zh = '如何在其他设备上阅读？',
    answer_zh = '使用您的账户登录后，可以从任何设备访问已购买的作品。我们支持网页浏览器、iOS应用和Android应用。阅读进度会自动同步。',
    question_es = '¿Cómo leo en otros dispositivos?',
    answer_es = 'Puede acceder a sus obras compradas desde cualquier dispositivo iniciando sesión con su cuenta. Soportamos navegadores web, aplicaciones iOS y Android. El progreso de lectura se sincroniza automáticamente.',
    question_fr = 'Comment lire sur d''autres appareils ?',
    answer_fr = 'Vous pouvez accéder à vos œuvres achetées depuis n''importe quel appareil en vous connectant avec votre compte. Nous prenons en charge les navigateurs web, les applications iOS et Android. La progression de lecture est synchronisée automatiquement.',
    question_de = 'Wie lese ich auf anderen Geräten?',
    answer_de = 'Sie können von jedem Gerät aus auf Ihre gekauften Werke zugreifen, indem Sie sich mit Ihrem Konto anmelden. Wir unterstützen Webbrowser, iOS- und Android-Apps. Der Lesefortschritt wird automatisch synchronisiert.',
    question_ko = '다른 기기에서 어떻게 읽나요?',
    answer_ko = '계정으로 로그인하면 어떤 기기에서든 구매한 작품에 접근할 수 있습니다. 웹 브라우저, iOS 앱, Android 앱을 지원합니다. 읽기 진행 상황은 자동으로 동기화됩니다.',
    question_ar = 'كيف أقرأ على أجهزة أخرى؟',
    answer_ar = 'يمكنك الوصول إلى الأعمال التي اشتريتها من أي جهاز عن طريق تسجيل الدخول بحسابك. نحن ندعم متصفحات الويب وتطبيقات iOS و Android. يتم مزامنة تقدم القراءة تلقائيًا.',
    question_pt = 'Como leio em outros dispositivos?',
    answer_pt = 'Você pode acessar suas obras compradas de qualquer dispositivo fazendo login com sua conta. Suportamos navegadores web, aplicativos iOS e Android. O progresso de leitura é sincronizado automaticamente.'
WHERE question_en LIKE 'How do I%read on other devices%';

-- FAQ: What is the difference between AI and human translation?
UPDATE faq_items SET
    question_ja = 'AI翻訳と人間翻訳の違いは何ですか？',
    answer_ja = 'AI翻訳は即座に結果が得られ、基本的な翻訳に適しています。人間翻訳は時間がかかりますが、ニュアンスや文化的な文脈をより正確に捉えます。重要な出版物には人間翻訳をお勧めします。',
    question_zh = 'AI翻译和人工翻译有什么区别？',
    answer_zh = 'AI翻译可以即时获得结果，适合基本翻译需求。人工翻译需要更多时间，但能更准确地把握细微差别和文化背景。对于重要出版物，我们建议使用人工翻译。',
    question_es = '¿Cuál es la diferencia entre la traducción de IA y la humana?',
    answer_es = 'La traducción de IA proporciona resultados instantáneos y es adecuada para traducciones básicas. La traducción humana toma más tiempo pero captura mejor los matices y el contexto cultural. Recomendamos la traducción humana para publicaciones importantes.',
    question_fr = 'Quelle est la différence entre la traduction IA et humaine ?',
    answer_fr = 'La traduction IA fournit des résultats instantanés et convient aux traductions de base. La traduction humaine prend plus de temps mais capture mieux les nuances et le contexte culturel. Nous recommandons la traduction humaine pour les publications importantes.',
    question_de = 'Was ist der Unterschied zwischen KI- und menschlicher Übersetzung?',
    answer_de = 'KI-Übersetzung liefert sofortige Ergebnisse und eignet sich für grundlegende Übersetzungen. Menschliche Übersetzung dauert länger, erfasst aber Nuancen und kulturellen Kontext besser. Für wichtige Veröffentlichungen empfehlen wir menschliche Übersetzung.',
    question_ko = 'AI 번역과 인간 번역의 차이점은 무엇인가요?',
    answer_ko = 'AI 번역은 즉각적인 결과를 제공하며 기본적인 번역에 적합합니다. 인간 번역은 시간이 더 걸리지만 뉘앙스와 문화적 맥락을 더 잘 포착합니다. 중요한 출판물에는 인간 번역을 권장합니다.',
    question_ar = 'ما الفرق بين ترجمة الذكاء الاصطناعي والترجمة البشرية؟',
    answer_ar = 'توفر ترجمة الذكاء الاصطناعي نتائج فورية وهي مناسبة للترجمات الأساسية. تستغرق الترجمة البشرية وقتًا أطول لكنها تلتقط الفروق الدقيقة والسياق الثقافي بشكل أفضل. نوصي بالترجمة البشرية للمنشورات المهمة.',
    question_pt = 'Qual é a diferença entre tradução de IA e humana?',
    answer_pt = 'A tradução de IA fornece resultados instantâneos e é adequada para traduções básicas. A tradução humana leva mais tempo, mas captura melhor as nuances e o contexto cultural. Recomendamos tradução humana para publicações importantes.'
WHERE question_en LIKE 'What is the difference between AI and human translation%';

-- 完了メッセージ
-- Phase 12-4e Part 5: 残り2件のFAQ翻訳完了
