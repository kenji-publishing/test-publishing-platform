-- 064: FAQに「AI校正を使った作品は、AI使用の明記で何を選ぶか」を追加（著者向け）
--
-- 2026-11-21 の決まり: AI校正（AIエディターなど）で文章を直した作品は、
-- アップロード画面の「AI使用の明記」の本文の欄で「AIアシスト」を選ぶ。
-- 同じ内容をコンテンツガイドライン（8. AIを使った作品の表示）にも書いた。
-- 選択肢の名前は、アップロード画面に実際に出る名前（各言語）に合わせてある。
--
-- INSERTは question_en の重複チェック付き（再実行しても二重登録されない）。

INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 5,
  $q$I used AI proofreading. What should I choose under “AI Usage Disclosure”?$q$, $q$AI校正を使った作品は、「AI使用の明記」で何を選べばよいですか？$q$, $q$使用了AI校对的作品，在“AI使用声明”中应该选择什么？$q$, $q$Usé la corrección con IA. ¿Qué debo elegir en «Declaración de uso de IA»?$q$, $q$J’ai utilisé la correction par IA. Que dois-je choisir dans « Déclaration d'utilisation de l'IA » ?$q$, $q$Ich habe das KI-Korrektorat genutzt. Was wähle ich unter „KI-Nutzungserklärung“?$q$, $q$AI 교정을 사용한 작품은 "AI 사용 공개"에서 무엇을 선택해야 하나요?$q$, $q$استخدمتُ التدقيق بالذكاء الاصطناعي. ماذا أختار في «إفصاح استخدام الذكاء الاصطناعي»؟$q$, $q$Usei a revisão por IA. O que devo escolher em “Declaração de uso de IA”?$q$, $q$Ho usato la correzione con IA. Cosa devo scegliere in «Dichiarazione Utilizzo AI»?$q$,
  $q$Choose “AI-Assisted” under “Text / Content”. If you send a manuscript corrected with AuctLect’s AI Editor straight to the upload page from the results screen, “AI-Assisted” is already selected. Your choice is shown to readers on the work page. For an edition translated with AI, choose “Fully AI-Translated” or “AI-Assisted” under “Translation”.$q$,
  $q$「本文 / コンテンツ」の欄で「AIアシスト」を選んでください。AuctLectのAIエディターで直した原稿を、結果の画面からそのままアップロード画面へ送ると、最初から「AIアシスト」が選ばれています。選んだ内容は、作品のページで読者に表示されます。AIで翻訳した版は、「翻訳」の欄で「完全AI翻訳」か「AIアシスト」を選びます。$q$,
  $q$请在“文本/内容”中选择“AI辅助”。如果从结果页面把用 AuctLect 的AI 编辑器修改过的原稿直接发送到上传页面，系统会预先选好“AI辅助”。所选内容会在作品页面向读者显示。使用AI翻译的版本，请在“翻译”中选择“完全AI翻译”或“AI辅助”。$q$,
  $q$Elige «Asistido por IA» en «Texto / Contenido». Si envías a la página de subida, desde la pantalla de resultados, un manuscrito corregido con la herramienta «Editor IA» de AuctLect, «Asistido por IA» ya aparece seleccionado. Lo que elijas se muestra a los lectores en la página de la obra. Para una edición traducida con IA, elige «Traducido completamente por IA» o «Asistido por IA» en «Traducción».$q$,
  $q$Choisissez « Assisté par IA » dans « Texte / Contenu ». Si vous envoyez vers la page d’envoi, depuis l’écran des résultats, un manuscrit corrigé avec l’outil « Éditeur IA » d’AuctLect, « Assisté par IA » est déjà sélectionné. Votre choix est affiché aux lecteurs sur la page de l’œuvre. Pour une édition traduite par IA, choisissez « Entièrement traduit par IA » ou « Assisté par IA » dans « Traduction ».$q$,
  $q$Wählen Sie unter „Text / Inhalt“ die Option „KI-unterstützt“. Wenn Sie ein mit dem Werkzeug „KI-Editor“ von AuctLect korrigiertes Manuskript direkt vom Ergebnisbildschirm an die Upload-Seite senden, ist „KI-unterstützt“ bereits ausgewählt. Ihre Angabe wird den Lesern auf der Werkseite angezeigt. Für eine mit KI übersetzte Ausgabe wählen Sie unter „Übersetzung“ die Option „Vollständig KI-übersetzt“ oder „KI-unterstützt“.$q$,
  $q$"텍스트 / 콘텐츠"에서 "AI 어시스트"를 선택해 주세요. AuctLect의 AI 편집기로 고친 원고를 결과 화면에서 바로 업로드 화면으로 보내면 "AI 어시스트"가 미리 선택되어 있습니다. 선택한 내용은 작품 페이지에서 독자에게 표시됩니다. AI로 번역한 판은 "번역"에서 "완전 AI 번역" 또는 "AI 어시스트"를 선택합니다.$q$,
  $q$اختر «بمساعدة الذكاء الاصطناعي» في «النص / المحتوى». إذا أرسلت مخطوطًا صُحِّح بأداة «محرر الذكاء الاصطناعي» في AuctLect من شاشة النتائج مباشرة إلى صفحة الرفع، فسيكون «بمساعدة الذكاء الاصطناعي» محددًا مسبقًا. يظهر اختيارك للقراء في صفحة العمل. للنسخة المترجمة بالذكاء الاصطناعي، اختر «ترجمة كاملة بالذكاء الاصطناعي» أو «بمساعدة الذكاء الاصطناعي» في «الترجمة».$q$,
  $q$Escolha “Assistido por IA” em “Texto / Conteúdo”. Se você enviar para a página de envio, a partir da tela de resultados, um manuscrito revisado com a ferramenta “Editor IA” do AuctLect, “Assistido por IA” já vem selecionado. Sua escolha é mostrada aos leitores na página da obra. Para uma edição traduzida com IA, escolha “Totalmente traduzido por IA” ou “Assistido por IA” em “Tradução”.$q$,
  $q$Scegli «Assistito da IA» in «Testo / Contenuti». Se invii alla pagina di caricamento, dalla schermata dei risultati, un manoscritto corretto con lo strumento «Editor IA» di AuctLect, «Assistito da IA» è già selezionato. La tua scelta viene mostrata ai lettori nella pagina dell’opera. Per un’edizione tradotta con l’IA, scegli «Completamente tradotto da IA» o «Assistito da IA» in «Traduzione».$q$,
  'AI proofreading editor disclosure assisted badge AI校正 校正 AIエディター AIアシスト AI使用の明記 表示 AI翻訳', 14, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'I used AI proofreading. What should I choose under “AI Usage Disclosure”?');
