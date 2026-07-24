-- 043: Help center content refresh (FAQ + Troubleshooting -> unified Help page)
--
-- ①イタリア語列の追加（従来9言語のみだった。UIは10言語対応済み）
-- ②実装と食い違っていた3件（決済方法・返金・翻訳依頼）の全言語書き直し
-- ③現行機能のよくある質問6件を追加（受取口座/分配率/アップロード形式/
--   Googleログイン/AIツール料金/翻訳者・編集者登録）
--
-- 既存行の更新は id + question_en の両方で照合し、想定と違う行を
-- 誤って書き換えないようにする。INSERTは question_en の重複チェック付き
-- （再実行しても二重登録されない）。

ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS question_it TEXT;
ALTER TABLE faq_items ADD COLUMN IF NOT EXISTS answer_it TEXT;
ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS name_it VARCHAR(100);

-- ===== カテゴリ名（イタリア語） =====
UPDATE faq_categories SET name_it = 'Account' WHERE id = 1;
UPDATE faq_categories SET name_it = 'Pagamenti' WHERE id = 2;
UPDATE faq_categories SET name_it = 'Opere' WHERE id = 3;
UPDATE faq_categories SET name_it = 'Traduzione' WHERE id = 4;
UPDATE faq_categories SET name_it = 'Per gli autori' WHERE id = 5;
UPDATE faq_categories SET name_it = 'Per i traduttori' WHERE id = 6;
UPDATE faq_categories SET name_it = 'Problemi tecnici' WHERE id = 7;
UPDATE faq_categories SET name_it = 'Altro' WHERE id = 8;

-- ===== 既存6件のイタリア語補完（内容は現行のまま） =====
UPDATE faq_items SET
  question_it = 'Come creo un account?',
  answer_it = $it$Fai clic sul pulsante "Registrati" in alto a destra nella homepage e inserisci il tuo indirizzo email e una password. Se vuoi registrarti come autore, traduttore o editor, usa la pagina di registrazione dedicata a ciascun ruolo.$it$
WHERE id = 1 AND question_en = 'How do I create an account?';

UPDATE faq_items SET
  question_it = 'Ho dimenticato la password',
  answer_it = $it$Fai clic sul link "Password dimenticata?" nella pagina di accesso e inserisci l'indirizzo email registrato. Ti invieremo un link per reimpostare la password via email.$it$
WHERE id = 2 AND question_en = 'I forgot my password';

UPDATE faq_items SET
  question_it = 'Voglio cambiare il mio indirizzo email',
  answer_it = $it$Puoi cambiarlo da "Impostazioni" → "Impostazioni account" nella tua dashboard. Una email di conferma sarà inviata al nuovo indirizzo. Fai clic sul link per completare la modifica.$it$
WHERE id = 3 AND question_en = 'I want to change my email address';

UPDATE faq_items SET
  question_it = $it$Quanto è accurata la traduzione IA?$it$,
  answer_it = $it$La traduzione IA utilizza modelli avanzati di apprendimento automatico e può tradurre testi generali con grande precisione. Tuttavia, per termini tecnici o espressioni letterarie, consigliamo la traduzione da parte di traduttori professionisti.$it$
WHERE id = 6 AND question_en = 'How accurate is the AI translation?';

UPDATE faq_items SET
  question_it = $it$L'opera non viene visualizzata$it$,
  answer_it = $it$Prova quanto segue: 1) Svuota la cache del browser, 2) Prova un altro browser, 3) Controlla la connessione a Internet. Se il problema persiste, contattaci.$it$
WHERE id = 8 AND question_en = 'The work is not displaying';

UPDATE faq_items SET
  question_it = $it$Qual è il browser consigliato?$it$,
  answer_it = $it$Consigliamo le versioni più recenti di Google Chrome, Firefox, Safari e Microsoft Edge. Internet Explorer non è supportato.$it$
WHERE id = 9 AND question_en = 'What is the recommended browser?';

-- ===== #4 決済方法（Stripe経由の現行手段に全面更新） =====
UPDATE faq_items SET
  answer_en = $q$You can pay by credit or debit card (Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay and — depending on your currency — PayPal and other methods. All payments are processed securely by Stripe, and the available options are shown automatically on the payment page. AuctLect never stores your card number.$q$,
  answer_ja = $q$クレジット/デビットカード（Visa・Mastercard・American Express・JCB）、Apple Pay、Google Payのほか、通貨によってはPayPalなどもご利用いただけます。決済はすべてStripeが安全に処理し、ご利用可能な方法は決済ページに自動的に表示されます。AuctLectがカード番号を保存することはありません。$q$,
  answer_zh = $q$您可以使用信用卡／簽帳金融卡（Visa、Mastercard、American Express、JCB）、Apple Pay、Google Pay付款；視貨幣而定，也可使用 PayPal 等方式。所有付款均由 Stripe 安全處理，可用的付款方式會自動顯示在付款頁面。AuctLect 不會儲存您的卡號。$q$,
  answer_es = $q$Puedes pagar con tarjeta de crédito o débito (Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay y, según tu moneda, también con PayPal y otros métodos. Todos los pagos se procesan de forma segura a través de Stripe y las opciones disponibles se muestran automáticamente en la página de pago. AuctLect nunca guarda el número de tu tarjeta.$q$,
  answer_fr = $q$Vous pouvez payer par carte de crédit ou de débit (Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay et, selon votre devise, par PayPal et d'autres méthodes. Tous les paiements sont traités en toute sécurité par Stripe et les options disponibles s'affichent automatiquement sur la page de paiement. AuctLect ne conserve jamais votre numéro de carte.$q$,
  answer_de = $q$Sie können mit Kredit- oder Debitkarte (Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay und – je nach Währung – auch mit PayPal und weiteren Methoden bezahlen. Alle Zahlungen werden sicher über Stripe abgewickelt; die verfügbaren Optionen werden automatisch auf der Zahlungsseite angezeigt. AuctLect speichert niemals Ihre Kartennummer.$q$,
  answer_ko = $q$신용/체크카드(Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay로 결제할 수 있으며, 통화에 따라 PayPal 등도 이용할 수 있습니다. 모든 결제는 Stripe가 안전하게 처리하며, 이용 가능한 방법은 결제 페이지에 자동으로 표시됩니다. AuctLect는 카드 번호를 저장하지 않습니다.$q$,
  answer_ar = $q$يمكنك الدفع ببطاقة الائتمان أو الخصم (Visa وMastercard وAmerican Express وJCB) وApple Pay وGoogle Pay، وحسب عملتك أيضًا عبر PayPal وطرق أخرى. تتم معالجة جميع المدفوعات بأمان عبر Stripe، وتظهر الخيارات المتاحة تلقائيًا في صفحة الدفع. لا يخزّن AuctLect رقم بطاقتك أبدًا.$q$,
  answer_pt = $q$Você pode pagar com cartão de crédito ou débito (Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay e, dependendo da sua moeda, também com PayPal e outros métodos. Todos os pagamentos são processados com segurança pela Stripe, e as opções disponíveis aparecem automaticamente na página de pagamento. O AuctLect nunca armazena o número do seu cartão.$q$,
  question_it = $q$Quali metodi di pagamento sono disponibili?$q$,
  answer_it = $q$Puoi pagare con carta di credito o debito (Visa, Mastercard, American Express, JCB), Apple Pay, Google Pay e, a seconda della valuta, anche con PayPal e altri metodi. Tutti i pagamenti sono elaborati in modo sicuro da Stripe e le opzioni disponibili vengono mostrate automaticamente nella pagina di pagamento. AuctLect non memorizza mai il numero della tua carta.$q$,
  keywords = 'payment card paypal apple google stripe 支払い 決済 カード',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 4 AND question_en = 'What payment methods are available?';

-- ===== #5 返金（実際の運用フローに更新） =====
UPDATE faq_items SET
  answer_en = $q$If it is within 7 days of purchase and you have not read a substantial part of the work, we can refund your purchase. Contact us via the "Feedback" link at the bottom of any page, including the work title. The refund goes back to your original payment method, and the work is then removed from your library.$q$,
  answer_ja = $q$購入から7日以内で、作品の大部分をまだお読みでない場合は返金いたします。ページ下部の「フィードバック」から作品名を添えてご連絡ください。返金はお支払いに使われた決済方法へ行われ、返金後は作品がライブラリから読めなくなります。$q$,
  answer_zh = $q$購買後7天內且尚未閱讀作品大部分內容時，可以退款。請透過頁面底部的「意見回饋」聯繫我們並註明作品名稱。款項將退回原付款方式，退款後該作品將從您的書庫中移除。$q$,
  answer_es = $q$Si han pasado menos de 7 días desde la compra y no has leído una parte sustancial de la obra, podemos reembolsarte. Contáctanos mediante el enlace "Comentarios" al pie de la página indicando el título de la obra. El reembolso se realiza al método de pago original y la obra se retira de tu biblioteca.$q$,
  answer_fr = $q$Si l'achat date de moins de 7 jours et que vous n'avez pas lu une partie substantielle de l'œuvre, nous pouvons vous rembourser. Contactez-nous via le lien « Commentaires » en bas de page en indiquant le titre de l'œuvre. Le remboursement est effectué sur le moyen de paiement d'origine et l'œuvre est retirée de votre bibliothèque.$q$,
  answer_de = $q$Wenn der Kauf weniger als 7 Tage zurückliegt und Sie noch keinen wesentlichen Teil des Werks gelesen haben, erstatten wir den Kauf. Kontaktieren Sie uns über den „Feedback“-Link am Seitenende und nennen Sie den Titel des Werks. Die Erstattung erfolgt auf die ursprüngliche Zahlungsmethode; das Werk wird danach aus Ihrer Bibliothek entfernt.$q$,
  answer_ko = $q$구매 후 7일 이내이고 작품의 상당 부분을 아직 읽지 않은 경우 환불해 드립니다. 페이지 하단의 "피드백" 링크로 작품명과 함께 문의해 주세요. 환불은 원래 결제 수단으로 처리되며, 환불 후에는 라이브러리에서 해당 작품을 읽을 수 없습니다.$q$,
  answer_ar = $q$إذا كان الشراء خلال آخر 7 أيام ولم تقرأ جزءًا كبيرًا من العمل، يمكننا رد المبلغ. تواصل معنا عبر رابط "الملاحظات" أسفل الصفحة مع ذكر عنوان العمل. يُعاد المبلغ إلى وسيلة الدفع الأصلية، ثم يُزال العمل من مكتبتك.$q$,
  answer_pt = $q$Se a compra foi feita há menos de 7 dias e você ainda não leu uma parte substancial da obra, podemos reembolsá-la. Entre em contato pelo link "Feedback" no rodapé da página, informando o título da obra. O reembolso é feito no método de pagamento original e a obra é removida da sua biblioteca.$q$,
  question_it = $q$Come posso richiedere un rimborso?$q$,
  answer_it = $q$Se sono passati meno di 7 giorni dall'acquisto e non hai letto una parte sostanziale dell'opera, possiamo rimborsarti. Contattaci tramite il link "Feedback" in fondo alla pagina indicando il titolo dell'opera. Il rimborso avviene sul metodo di pagamento originale e l'opera viene rimossa dalla tua libreria.$q$,
  keywords = 'refund return 返金 払い戻し キャンセル',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 5 AND question_en = 'How do I request a refund?';

-- ===== #7 翻訳者への依頼（現行のディレクトリ+同意書フローに更新） =====
UPDATE faq_items SET
  answer_en = $q$Open the "Find Translators" page to browse profiles by language pair and specialty, then use the request button on a profile to message the translator about your work. When they accept and you both sign the collaboration agreement, work begins — their 20% revenue share is then paid automatically on every sale.$q$,
  answer_ja = $q$「翻訳者を探す」ページで言語や得意分野からプロフィールを閲覧し、依頼ボタンから作品についてメッセージを送ってください。翻訳者が承諾し、双方がコラボ同意書に署名すると作業開始です。以後は売上のたびに翻訳者分（20%）が自動で分配されます。$q$,
  answer_zh = $q$在「尋找譯者」頁面依語言組合與專長瀏覽譯者檔案，然後透過檔案中的委託按鈕，就您的作品發送訊息。譯者接受且雙方簽署合作協議後即開始作業，之後每筆銷售將自動分配譯者20%的收益。$q$,
  answer_es = $q$Abre la página "Buscar traductores" para ver perfiles por idioma y especialidad, y usa el botón de solicitud del perfil para enviar un mensaje sobre tu obra. Cuando el traductor acepte y ambos firmen el acuerdo de colaboración, comienza el trabajo; a partir de entonces su 20 % de los ingresos se reparte automáticamente en cada venta.$q$,
  answer_fr = $q$Ouvrez la page « Trouver des traducteurs » pour parcourir les profils par langue et spécialité, puis utilisez le bouton de demande d'un profil pour envoyer un message au sujet de votre œuvre. Lorsque le traducteur accepte et que vous signez tous deux l'accord de collaboration, le travail commence — sa part de 20 % des revenus est ensuite versée automatiquement à chaque vente.$q$,
  answer_de = $q$Öffnen Sie die Seite „Übersetzer finden“, um Profile nach Sprache und Fachgebiet zu durchsuchen, und senden Sie über die Anfrage-Schaltfläche eines Profils eine Nachricht zu Ihrem Werk. Nimmt der Übersetzer an und unterzeichnen beide die Kooperationsvereinbarung, beginnt die Arbeit — sein Anteil von 20 % wird danach bei jedem Verkauf automatisch ausgezahlt.$q$,
  answer_ko = $q$"번역가 찾기" 페이지에서 언어와 전문 분야별로 프로필을 살펴보고, 프로필의 의뢰 버튼으로 작품에 대해 메시지를 보내세요. 번역가가 수락하고 양측이 협업 동의서에 서명하면 작업이 시작되며, 이후 판매마다 번역가 몫(20%)이 자동으로 분배됩니다.$q$,
  answer_ar = $q$افتح صفحة "البحث عن مترجمين" لتصفح الملفات حسب اللغة والتخصص، ثم استخدم زر الطلب في الملف لإرسال رسالة حول عملك. عندما يقبل المترجم وتوقعان معًا اتفاقية التعاون، يبدأ العمل — وتُدفع حصته البالغة 20% تلقائيًا مع كل عملية بيع.$q$,
  answer_pt = $q$Abra a página "Encontrar tradutores" para ver perfis por idioma e especialidade e use o botão de solicitação do perfil para enviar uma mensagem sobre a sua obra. Quando o tradutor aceitar e ambos assinarem o acordo de colaboração, o trabalho começa — a parte de 20% dele passa a ser paga automaticamente em cada venda.$q$,
  question_it = $q$Come posso incaricare direttamente un traduttore?$q$,
  answer_it = $q$Apri la pagina "Trova traduttori" per sfogliare i profili per lingua e specializzazione, poi usa il pulsante di richiesta sul profilo per inviare un messaggio sulla tua opera. Quando il traduttore accetta ed entrambi firmate l'accordo di collaborazione, il lavoro inizia — la sua quota del 20% viene poi pagata automaticamente a ogni vendita.$q$,
  keywords = 'translator request hire 翻訳者 依頼 探す directory',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 7 AND question_en = 'How do I directly request a translator?';

-- ===== 新規: 収益の受け取り方法・時期（著者向け） =====
INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 5,
  $q$How and when do I receive my earnings?$q$, $q$収益はいつ・どのように受け取れますか？$q$, $q$收益何時、如何領取？$q$, $q$¿Cómo y cuándo recibo mis ingresos?$q$, $q$Comment et quand vais-je recevoir mes revenus ?$q$, $q$Wie und wann erhalte ich meine Einnahmen?$q$, $q$수익은 언제, 어떻게 받을 수 있나요?$q$, $q$كيف ومتى أستلم أرباحي؟$q$, $q$Como e quando recebo meus ganhos?$q$, $q$Come e quando ricevo i miei guadagni?$q$,
  $q$Register your bank account under Profile → "Payout Account" — no Stripe or PayPal account is needed. Earnings close at the end of each month and are paid to your bank account by the 15th of the following month. The minimum payout is ¥3,000 / $20 / £15; smaller balances carry over, or you can opt in to receive them monthly with a small transfer fee deducted.$q$,
  $q$プロフィール →「受取口座」に銀行口座をご登録ください（StripeやPayPalのアカウントは不要です）。収益は毎月末に締め、翌月15日までに銀行口座へお支払いします。最低支払額は ¥3,000 / $20 / £15 で、未満の残高は翌月に繰り越されます（少額でも手数料を差し引いて毎月受け取る設定も可能です）。$q$,
  $q$請在個人資料 →「收款帳戶」登記您的銀行帳戶（無需 Stripe 或 PayPal 帳戶）。收益於每月月底結算，並於次月15日前匯入您的銀行帳戶。最低支付額為 ¥3,000 / $20 / £15，未達金額將結轉至次月（也可選擇扣除少額手續費後每月領取）。$q$,
  $q$Registra tu cuenta bancaria en Perfil → "Cuenta de cobro"; no necesitas cuenta de Stripe ni PayPal. Los ingresos se cierran a fin de mes y se pagan a tu cuenta antes del día 15 del mes siguiente. El pago mínimo es ¥3.000 / $20 / £15; los saldos menores se acumulan, o puedes optar por recibirlos cada mes con una pequeña comisión.$q$,
  $q$Enregistrez votre compte bancaire dans Profil → « Compte de versement » — aucun compte Stripe ou PayPal n'est nécessaire. Les revenus sont arrêtés en fin de mois et versés sur votre compte avant le 15 du mois suivant. Le versement minimum est de ¥3 000 / $20 / £15 ; les soldes inférieurs sont reportés, ou vous pouvez choisir de les recevoir chaque mois moyennant de petits frais.$q$,
  $q$Registrieren Sie Ihr Bankkonto unter Profil → „Auszahlungskonto“ — ein Stripe- oder PayPal-Konto ist nicht nötig. Einnahmen werden zum Monatsende abgerechnet und bis zum 15. des Folgemonats überwiesen. Die Mindestauszahlung beträgt ¥3.000 / $20 / £15; kleinere Beträge werden übertragen, oder Sie erhalten sie auf Wunsch monatlich gegen eine kleine Gebühr.$q$,
  $q$프로필 → "수령 계좌"에 은행 계좌를 등록하세요(Stripe나 PayPal 계정은 필요 없습니다). 수익은 매월 말 마감되어 다음 달 15일까지 은행 계좌로 지급됩니다. 최소 지급액은 ¥3,000 / $20 / £15이며, 미달 금액은 이월됩니다(소액 수수료를 공제하고 매월 받도록 설정할 수도 있습니다).$q$,
  $q$سجّل حسابك البنكي في الملف الشخصي ← "حساب الاستلام" — لا حاجة لحساب Stripe أو PayPal. تُغلق الأرباح نهاية كل شهر وتُدفع إلى حسابك البنكي بحلول اليوم 15 من الشهر التالي. الحد الأدنى للدفع ¥3,000 / $20 / £15؛ وتُرحَّل المبالغ الأقل، أو يمكنك اختيار استلامها شهريًا مع خصم رسوم تحويل بسيطة.$q$,
  $q$Registre sua conta bancária em Perfil → "Conta de recebimento" — não é preciso ter conta Stripe ou PayPal. Os ganhos fecham no fim de cada mês e são pagos na sua conta até o dia 15 do mês seguinte. O pagamento mínimo é ¥3.000 / $20 / £15; saldos menores acumulam, ou você pode optar por recebê-los mensalmente com uma pequena taxa.$q$,
  $q$Registra il tuo conto bancario in Profilo → "Conto di accredito" — non serve un account Stripe o PayPal. I guadagni si chiudono a fine mese e vengono pagati sul tuo conto entro il 15 del mese successivo. Il pagamento minimo è ¥3.000 / $20 / £15; gli importi inferiori vengono riportati, oppure puoi scegliere di riceverli ogni mese con una piccola commissione.$q$,
  'payout earnings bank 収益 受け取り 振込 口座 支払い revenue', 10, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'How and when do I receive my earnings?');

-- ===== 新規: 収益の分配率 =====
INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 5,
  $q$What share of sales do creators receive?$q$, $q$売上の分配率はどうなっていますか？$q$, $q$銷售收益如何分配？$q$, $q$¿Qué parte de las ventas reciben los creadores?$q$, $q$Quelle part des ventes revient aux créateurs ?$q$, $q$Welchen Anteil am Verkauf erhalten die Kreativen?$q$, $q$판매 수익은 어떻게 분배되나요?$q$, $q$ما نصيب المبدعين من المبيعات؟$q$, $q$Qual parte das vendas os criadores recebem?$q$, $q$Quale quota delle vendite ricevono i creatori?$q$,
  $q$The platform fee is a flat 30%. With no collaborators the author receives 70% of each sale. When collaborators are attached, the translator receives 20% and the editor 10%, and the author receives the remainder (40–60%). Works translated with the AI tools have no translator share, so the author keeps 70%.$q$,
  $q$プラットフォーム手数料は一律30%です。コラボレーターがいない場合、著者の取り分は売上の70%。翻訳者が付く場合は20%、編集者が付く場合は10%が分配され、残りが著者の取り分（40〜60%）となります。AIツールで翻訳した作品には翻訳者分配が無いため、著者は70%のままです。$q$,
  $q$平台手續費固定為30%。沒有合作者時，作者可獲得每筆銷售的70%；有合作者時，譯者獲得20%、編輯獲得10%，其餘（40〜60%）歸作者。使用AI工具翻譯的作品沒有譯者分成，作者仍保有70%。$q$,
  $q$La comisión de la plataforma es un 30 % fijo. Sin colaboradores, el autor recibe el 70 % de cada venta. Con colaboradores, el traductor recibe el 20 % y el editor el 10 %, y el autor recibe el resto (40–60 %). Las obras traducidas con las herramientas de IA no tienen parte del traductor, por lo que el autor conserva el 70 %.$q$,
  $q$La commission de la plateforme est fixe : 30 %. Sans collaborateurs, l'auteur reçoit 70 % de chaque vente. Avec des collaborateurs, le traducteur reçoit 20 % et l'éditeur 10 %, l'auteur recevant le reste (40–60 %). Les œuvres traduites avec les outils IA n'ont pas de part traducteur : l'auteur conserve 70 %.$q$,
  $q$Die Plattformgebühr beträgt pauschal 30 %. Ohne Mitwirkende erhält der Autor 70 % jedes Verkaufs. Mit Mitwirkenden erhält der Übersetzer 20 % und der Lektor 10 %, der Autor den Rest (40–60 %). Mit den KI-Tools übersetzte Werke haben keinen Übersetzeranteil, der Autor behält also 70 %.$q$,
  $q$플랫폼 수수료는 일률 30%입니다. 협업자가 없으면 작가가 판매액의 70%를 받습니다. 협업자가 있으면 번역가 20%, 편집자 10%가 분배되고 나머지(40~60%)가 작가 몫입니다. AI 도구로 번역한 작품은 번역가 분배가 없어 작가가 70%를 유지합니다.$q$,
  $q$رسوم المنصة ثابتة عند 30%. بدون متعاونين يحصل المؤلف على 70% من كل عملية بيع. مع وجود متعاونين، يحصل المترجم على 20% والمحرر على 10%، ويحصل المؤلف على الباقي (40–60%). الأعمال المترجمة بأدوات الذكاء الاصطناعي لا حصة مترجم فيها، فيحتفظ المؤلف بـ70%.$q$,
  $q$A taxa da plataforma é fixa em 30%. Sem colaboradores, o autor recebe 70% de cada venda. Com colaboradores, o tradutor recebe 20% e o editor 10%, e o autor fica com o restante (40–60%). Obras traduzidas com as ferramentas de IA não têm parte de tradutor, então o autor mantém 70%.$q$,
  $q$La commissione della piattaforma è fissa al 30%. Senza collaboratori l'autore riceve il 70% di ogni vendita. Con collaboratori, il traduttore riceve il 20% e l'editor il 10%, e all'autore va il resto (40–60%). Le opere tradotte con gli strumenti IA non hanno quota del traduttore, quindi l'autore mantiene il 70%.$q$,
  'revenue share split 分配 取り分 印税 royalty percentage', 11, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'What share of sales do creators receive?');

-- ===== 新規: アップロード形式 =====
INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 5,
  $q$What file formats can I upload?$q$, $q$どのファイル形式をアップロードできますか？$q$, $q$可以上傳哪些檔案格式？$q$, $q$¿Qué formatos de archivo puedo subir?$q$, $q$Quels formats de fichiers puis-je téléverser ?$q$, $q$Welche Dateiformate kann ich hochladen?$q$, $q$어떤 파일 형식을 업로드할 수 있나요?$q$, $q$ما صيغ الملفات التي يمكنني رفعها؟$q$, $q$Quais formatos de arquivo posso enviar?$q$, $q$Quali formati di file posso caricare?$q$,
  $q$Novels: .txt or Word (.docx) — images and tables inside Word files are displayed in the reader. Manga: page images (JPG/PNG/WebP, up to 14MB each) or a PDF, which is converted to page images automatically. Chapters are detected from file names like "1-01.jpg" and can also be set manually.$q$,
  $q$小説は .txt または Word（.docx）に対応し、Word内の挿絵や表もリーダーに表示されます。マンガはページ画像（JPG/PNG/WebP、各14MBまで）またはPDF（自動でページ画像に変換）をアップロードできます。章は「1-01.jpg」のようなファイル名から自動判定されるほか、手動でも設定できます。$q$,
  $q$小說支援 .txt 或 Word（.docx），Word 內的插圖與表格也會顯示在閱讀器中。漫畫可上傳頁面圖片（JPG/PNG/WebP，每張最大14MB）或 PDF（自動轉換為頁面圖片）。章節可從「1-01.jpg」等檔名自動判斷，也可手動設定。$q$,
  $q$Novelas: .txt o Word (.docx); las imágenes y tablas dentro de los archivos Word se muestran en el lector. Manga: imágenes de página (JPG/PNG/WebP, hasta 14 MB cada una) o un PDF, que se convierte automáticamente en páginas. Los capítulos se detectan por nombres de archivo como "1-01.jpg" y también pueden definirse manualmente.$q$,
  $q$Romans : .txt ou Word (.docx) — les images et tableaux des fichiers Word s'affichent dans le lecteur. Manga : images de pages (JPG/PNG/WebP, 14 Mo max chacune) ou un PDF, converti automatiquement en pages. Les chapitres sont détectés à partir de noms de fichiers comme « 1-01.jpg » et peuvent aussi être définis manuellement.$q$,
  $q$Romane: .txt oder Word (.docx) — Bilder und Tabellen in Word-Dateien werden im Reader angezeigt. Manga: Seitenbilder (JPG/PNG/WebP, je bis 14 MB) oder eine PDF, die automatisch in Seiten umgewandelt wird. Kapitel werden aus Dateinamen wie „1-01.jpg“ erkannt und können auch manuell gesetzt werden.$q$,
  $q$소설은 .txt 또는 Word(.docx)를 지원하며, Word 안의 삽화와 표도 리더에 표시됩니다. 만화는 페이지 이미지(JPG/PNG/WebP, 각 14MB까지) 또는 PDF(자동으로 페이지 이미지로 변환)를 업로드할 수 있습니다. 챕터는 "1-01.jpg" 같은 파일명에서 자동 인식되며 수동 설정도 가능합니다.$q$,
  $q$الروايات: ‎.txt أو Word (‎.docx) — تُعرض الصور والجداول داخل ملفات Word في القارئ. المانجا: صور الصفحات (JPG/PNG/WebP، حتى 14MB لكل صورة) أو ملف PDF يُحوَّل تلقائيًا إلى صفحات. تُكتشف الفصول من أسماء الملفات مثل "1-01.jpg" ويمكن تعيينها يدويًا أيضًا.$q$,
  $q$Romances: .txt ou Word (.docx) — imagens e tabelas dentro de arquivos Word aparecem no leitor. Mangá: imagens de página (JPG/PNG/WebP, até 14MB cada) ou um PDF, convertido automaticamente em páginas. Os capítulos são detectados por nomes de arquivo como "1-01.jpg" e também podem ser definidos manualmente.$q$,
  $q$Romanzi: .txt o Word (.docx) — immagini e tabelle nei file Word vengono mostrate nel lettore. Manga: immagini delle pagine (JPG/PNG/WebP, fino a 14MB ciascuna) o un PDF, convertito automaticamente in pagine. I capitoli vengono riconosciuti da nomi file come "1-01.jpg" e possono anche essere impostati manualmente.$q$,
  'upload format docx pdf txt manga アップロード 形式 ファイル ワード', 12, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'What file formats can I upload?');

-- ===== 新規: Googleログイン =====
INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 1,
  $q$Can I sign in with Google?$q$, $q$Googleアカウントでログインできますか？$q$, $q$可以使用Google帳戶登入嗎？$q$, $q$¿Puedo iniciar sesión con Google?$q$, $q$Puis-je me connecter avec Google ?$q$, $q$Kann ich mich mit Google anmelden?$q$, $q$Google 계정으로 로그인할 수 있나요?$q$, $q$هل يمكنني تسجيل الدخول بحساب Google؟$q$, $q$Posso entrar com o Google?$q$, $q$Posso accedere con Google?$q$,
  $q$Yes. Use the "Sign in with Google" button on the login or sign-up page. A new account is created automatically with no email verification step, and if an account with the same email address already exists it is linked — afterwards you can sign in either way.$q$,
  $q$はい。ログイン/新規登録ページの「Googleでログイン」ボタンをご利用ください。アカウントは自動で作成され、確認メールの手順も不要です。同じメールアドレスの既存アカウントがある場合は紐付けられ、以後はどちらの方法でもログインできます。$q$,
  $q$可以。請使用登入或註冊頁面的「使用Google登入」按鈕。帳戶將自動建立，無需電子郵件驗證步驟；若已有相同電子郵件的帳戶則會自動連結，之後兩種方式皆可登入。$q$,
  $q$Sí. Usa el botón "Iniciar sesión con Google" en la página de acceso o registro. La cuenta se crea automáticamente sin paso de verificación por correo y, si ya existe una cuenta con el mismo correo, se vincula; después podrás acceder de cualquiera de las dos formas.$q$,
  $q$Oui. Utilisez le bouton « Se connecter avec Google » sur la page de connexion ou d'inscription. Le compte est créé automatiquement, sans étape de vérification par e-mail, et s'il existe déjà un compte avec la même adresse, il est lié — vous pourrez ensuite vous connecter des deux façons.$q$,
  $q$Ja. Nutzen Sie die Schaltfläche „Mit Google anmelden“ auf der Anmelde- oder Registrierungsseite. Das Konto wird automatisch erstellt, ohne E-Mail-Bestätigung, und ein bestehendes Konto mit derselben Adresse wird verknüpft — danach können Sie sich auf beide Arten anmelden.$q$,
  $q$네. 로그인/회원가입 페이지의 "Google로 로그인" 버튼을 이용하세요. 계정이 자동으로 생성되며 이메일 인증 절차도 필요 없습니다. 같은 이메일의 기존 계정이 있으면 연결되어 이후 두 방법 모두 사용할 수 있습니다.$q$,
  $q$نعم. استخدم زر "تسجيل الدخول عبر Google" في صفحة تسجيل الدخول أو التسجيل. يُنشأ الحساب تلقائيًا دون خطوة تأكيد البريد، وإذا كان هناك حساب بنفس البريد الإلكتروني فسيتم ربطه — وبعدها يمكنك الدخول بأي من الطريقتين.$q$,
  $q$Sim. Use o botão "Entrar com o Google" na página de login ou cadastro. A conta é criada automaticamente, sem etapa de verificação de e-mail, e se já existir uma conta com o mesmo e-mail ela é vinculada — depois você pode entrar das duas formas.$q$,
  $q$Sì. Usa il pulsante "Accedi con Google" nella pagina di accesso o registrazione. L'account viene creato automaticamente senza verifica email e, se esiste già un account con la stessa email, viene collegato — in seguito potrai accedere in entrambi i modi.$q$,
  'google login sign in ログイン グーグル oauth', 10, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'Can I sign in with Google?');

-- ===== 新規: AIツール料金 =====
INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 4,
  $q$How much do the AI translation and editing tools cost?$q$, $q$AI翻訳・AI校正ツールの料金はいくらですか？$q$, $q$AI翻譯與AI校對工具的費用是多少？$q$, $q$¿Cuánto cuestan las herramientas de traducción y corrección con IA?$q$, $q$Combien coûtent les outils IA de traduction et de correction ?$q$, $q$Was kosten die KI-Übersetzungs- und Lektorat-Tools?$q$, $q$AI 번역·AI 교정 도구의 요금은 얼마인가요?$q$, $q$كم تكلفة أدوات الترجمة والتحرير بالذكاء الاصطناعي؟$q$, $q$Quanto custam as ferramentas de tradução e revisão com IA?$q$, $q$Quanto costano gli strumenti IA di traduzione e revisione?$q$,
  $q$You choose from three quality tiers. Text tools (novel translation and AI editing) cost ¥1–¥10 per 1,000 characters; manga translation costs ¥3–¥20 per page. The minimum per order is ¥100, and before paying you can compare all three tiers on a sample for free.$q$,
  $q$3つの品質から選べます。テキスト系（小説翻訳・AI校正）は1,000文字あたり¥1〜¥10、マンガ翻訳は1ページあたり¥3〜¥20です。1回の注文の最低料金は¥100で、支払い前にサンプルで3品質を無料で比較できます。$q$,
  $q$可從三種品質等級中選擇。文字類（小說翻譯、AI校對）每1,000字¥1〜¥10；漫畫翻譯每頁¥3〜¥20。每筆訂單最低¥100，付款前可免費用樣本比較三種品質。$q$,
  $q$Eliges entre tres niveles de calidad. Las herramientas de texto (traducción de novelas y corrección con IA) cuestan ¥1–¥10 por cada 1.000 caracteres; la traducción de manga, ¥3–¥20 por página. El mínimo por pedido es ¥100 y, antes de pagar, puedes comparar gratis los tres niveles con una muestra.$q$,
  $q$Vous choisissez parmi trois niveaux de qualité. Les outils texte (traduction de romans et correction IA) coûtent ¥1–¥10 pour 1 000 caractères ; la traduction de manga, ¥3–¥20 par page. Le minimum par commande est de ¥100 et, avant de payer, vous pouvez comparer gratuitement les trois niveaux sur un échantillon.$q$,
  $q$Sie wählen aus drei Qualitätsstufen. Text-Tools (Romanübersetzung und KI-Lektorat) kosten ¥1–¥10 pro 1.000 Zeichen; Manga-Übersetzung ¥3–¥20 pro Seite. Das Minimum pro Bestellung beträgt ¥100, und vor dem Bezahlen können Sie alle drei Stufen kostenlos an einer Probe vergleichen.$q$,
  $q$세 가지 품질 중에서 선택합니다. 텍스트 도구(소설 번역·AI 교정)는 1,000자당 ¥1~¥10, 만화 번역은 페이지당 ¥3~¥20입니다. 주문당 최소 금액은 ¥100이며, 결제 전에 샘플로 세 품질을 무료로 비교할 수 있습니다.$q$,
  $q$تختار من ثلاثة مستويات جودة. أدوات النصوص (ترجمة الروايات والتحرير بالذكاء الاصطناعي) تكلف ¥1–¥10 لكل 1,000 حرف؛ وترجمة المانجا ¥3–¥20 للصفحة. الحد الأدنى للطلب ¥100، وقبل الدفع يمكنك مقارنة المستويات الثلاثة مجانًا على عيّنة.$q$,
  $q$Você escolhe entre três níveis de qualidade. As ferramentas de texto (tradução de romances e revisão com IA) custam ¥1–¥10 por 1.000 caracteres; a tradução de mangá, ¥3–¥20 por página. O mínimo por pedido é ¥100 e, antes de pagar, você pode comparar os três níveis gratuitamente com uma amostra.$q$,
  $q$Scegli tra tre livelli di qualità. Gli strumenti di testo (traduzione di romanzi e revisione IA) costano ¥1–¥10 ogni 1.000 caratteri; la traduzione di manga ¥3–¥20 a pagina. Il minimo per ordine è ¥100 e, prima di pagare, puoi confrontare gratuitamente i tre livelli su un campione.$q$,
  'ai price cost 料金 価格 翻訳 校正 マンガ pricing', 10, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'How much do the AI translation and editing tools cost?');

-- ===== 新規: 翻訳者・編集者として活動する =====
INSERT INTO faq_items (category_id, question_en, question_ja, question_zh, question_es, question_fr, question_de, question_ko, question_ar, question_pt, question_it,
                       answer_en, answer_ja, answer_zh, answer_es, answer_fr, answer_de, answer_ko, answer_ar, answer_pt, answer_it,
                       keywords, display_order, is_active)
SELECT 6,
  $q$How do I work as a translator or editor on AuctLect?$q$, $q$翻訳者・編集者として活動するにはどうすればいいですか？$q$, $q$如何在AuctLect擔任譯者或編輯？$q$, $q$¿Cómo puedo trabajar como traductor o editor en AuctLect?$q$, $q$Comment travailler comme traducteur ou éditeur sur AuctLect ?$q$, $q$Wie arbeite ich als Übersetzer oder Lektor auf AuctLect?$q$, $q$AuctLect에서 번역가나 편집자로 활동하려면 어떻게 하나요?$q$, $q$كيف أعمل كمترجم أو محرر في AuctLect؟$q$, $q$Como trabalhar como tradutor ou editor no AuctLect?$q$, $q$Come posso lavorare come traduttore o editor su AuctLect?$q$,
  $q$Open the user menu at the top right and choose "Register as Translator" or "Register as Editor" to create a public profile. Authors find you in the directory and contact you by message. Work starts once both sides sign the collaboration agreement, and your revenue share (translator 20% / editor 10%) is paid automatically on every sale.$q$,
  $q$画面右上のユーザーメニューから「翻訳者登録」または「編集者登録」を選び、公開プロフィールを作成してください。著者はディレクトリからあなたを見つけ、メッセージで依頼します。双方がコラボ同意書に署名すると作業開始となり、以後の売上から分配（翻訳者20%・編集者10%）が自動で支払われます。$q$,
  $q$從畫面右上角的使用者選單選擇「註冊為譯者」或「註冊為編輯」，建立公開檔案。作者會在名錄中找到您並透過訊息委託。雙方簽署合作協議後即開始作業，之後每筆銷售將自動支付您的分成（譯者20%／編輯10%）。$q$,
  $q$Abre el menú de usuario (arriba a la derecha) y elige "Registrarse como traductor" o "Registrarse como editor" para crear un perfil público. Los autores te encuentran en el directorio y te contactan por mensaje. El trabajo comienza cuando ambos firman el acuerdo de colaboración, y tu parte (traductor 20 % / editor 10 %) se paga automáticamente en cada venta.$q$,
  $q$Ouvrez le menu utilisateur (en haut à droite) et choisissez « Devenir traducteur » ou « Devenir éditeur » pour créer un profil public. Les auteurs vous trouvent dans l'annuaire et vous contactent par message. Le travail commence quand les deux parties signent l'accord de collaboration, et votre part (traducteur 20 %, éditeur 10 %) est versée automatiquement à chaque vente.$q$,
  $q$Öffnen Sie das Benutzermenü oben rechts und wählen Sie „Als Übersetzer registrieren“ oder „Als Lektor registrieren“, um ein öffentliches Profil zu erstellen. Autoren finden Sie im Verzeichnis und kontaktieren Sie per Nachricht. Die Arbeit beginnt, sobald beide die Kooperationsvereinbarung unterzeichnen; Ihr Anteil (Übersetzer 20 % / Lektor 10 %) wird bei jedem Verkauf automatisch ausgezahlt.$q$,
  $q$화면 오른쪽 위 사용자 메뉴에서 "번역가 등록" 또는 "편집자 등록"을 선택해 공개 프로필을 만드세요. 작가가 디렉터리에서 당신을 찾아 메시지로 의뢰합니다. 양측이 협업 동의서에 서명하면 작업이 시작되고, 이후 판매마다 분배금(번역가 20%/편집자 10%)이 자동으로 지급됩니다.$q$,
  $q$افتح قائمة المستخدم أعلى اليمين واختر "التسجيل كمترجم" أو "التسجيل كمحرر" لإنشاء ملف عام. يجدك المؤلفون في الدليل ويتواصلون معك بالرسائل. يبدأ العمل عندما يوقّع الطرفان اتفاقية التعاون، وتُدفع حصتك (المترجم 20% / المحرر 10%) تلقائيًا مع كل عملية بيع.$q$,
  $q$Abra o menu do usuário no canto superior direito e escolha "Registrar-se como tradutor" ou "Registrar-se como editor" para criar um perfil público. Os autores encontram você no diretório e entram em contato por mensagem. O trabalho começa quando ambos assinam o acordo de colaboração, e sua parte (tradutor 20% / editor 10%) é paga automaticamente em cada venda.$q$,
  $q$Apri il menu utente in alto a destra e scegli "Registrati come traduttore" o "Registrati come editor" per creare un profilo pubblico. Gli autori ti trovano nella directory e ti contattano via messaggio. Il lavoro inizia quando entrambi firmate l'accordo di collaborazione e la tua quota (traduttore 20% / editor 10%) viene pagata automaticamente a ogni vendita.$q$,
  'translator editor register 翻訳者 編集者 登録 仕事 collaborate', 10, true
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE question_en = 'How do I work as a translator or editor on AuctLect?');
