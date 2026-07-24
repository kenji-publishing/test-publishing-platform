-- 044: 返金FAQ(#5)の連絡先を修正
--
-- 043で「フィードバックから連絡」と書いたが、フィードバック機能は
-- 作品の翻訳品質報告専用（work_id必須・原文/訳文入力式）で、返金依頼の
-- 受け皿にならない（kenjiさん実機確認で発覚）。一般問い合わせの窓口である
-- メール(info@auctlect.com)宛てに全10言語を書き直す。

UPDATE faq_items SET
  answer_en = $q$If it is within 7 days of purchase and you have not read a substantial part of the work, we can refund your purchase. Email us at info@auctlect.com with the work title and the email address of your account. The refund goes back to your original payment method, and the work is then removed from your library.$q$,
  answer_ja = $q$購入から7日以内で、作品の大部分をまだお読みでない場合は返金いたします。作品名とご登録のメールアドレスを添えて info@auctlect.com までご連絡ください。返金はお支払いに使われた決済方法へ行われ、返金後は作品がライブラリから読めなくなります。$q$,
  answer_zh = $q$購買後7天內且尚未閱讀作品大部分內容時，可以退款。請附上作品名稱與您帳戶的電子郵件地址，寄信至 info@auctlect.com。款項將退回原付款方式，退款後該作品將從您的書庫中移除。$q$,
  answer_es = $q$Si han pasado menos de 7 días desde la compra y no has leído una parte sustancial de la obra, podemos reembolsarte. Escríbenos a info@auctlect.com indicando el título de la obra y el correo de tu cuenta. El reembolso se realiza al método de pago original y la obra se retira de tu biblioteca.$q$,
  answer_fr = $q$Si l'achat date de moins de 7 jours et que vous n'avez pas lu une partie substantielle de l'œuvre, nous pouvons vous rembourser. Écrivez-nous à info@auctlect.com en indiquant le titre de l'œuvre et l'adresse e-mail de votre compte. Le remboursement est effectué sur le moyen de paiement d'origine et l'œuvre est retirée de votre bibliothèque.$q$,
  answer_de = $q$Wenn der Kauf weniger als 7 Tage zurückliegt und Sie noch keinen wesentlichen Teil des Werks gelesen haben, erstatten wir den Kauf. Schreiben Sie uns an info@auctlect.com mit dem Titel des Werks und der E-Mail-Adresse Ihres Kontos. Die Erstattung erfolgt auf die ursprüngliche Zahlungsmethode; das Werk wird danach aus Ihrer Bibliothek entfernt.$q$,
  answer_ko = $q$구매 후 7일 이내이고 작품의 상당 부분을 아직 읽지 않은 경우 환불해 드립니다. 작품명과 계정 이메일 주소를 적어 info@auctlect.com 으로 연락해 주세요. 환불은 원래 결제 수단으로 처리되며, 환불 후에는 라이브러리에서 해당 작품을 읽을 수 없습니다.$q$,
  answer_ar = $q$إذا كان الشراء خلال آخر 7 أيام ولم تقرأ جزءًا كبيرًا من العمل، يمكننا رد المبلغ. راسلنا على info@auctlect.com مع ذكر عنوان العمل والبريد الإلكتروني لحسابك. يُعاد المبلغ إلى وسيلة الدفع الأصلية، ثم يُزال العمل من مكتبتك.$q$,
  answer_pt = $q$Se a compra foi feita há menos de 7 dias e você ainda não leu uma parte substancial da obra, podemos reembolsá-la. Escreva para info@auctlect.com informando o título da obra e o e-mail da sua conta. O reembolso é feito no método de pagamento original e a obra é removida da sua biblioteca.$q$,
  answer_it = $q$Se sono passati meno di 7 giorni dall'acquisto e non hai letto una parte sostanziale dell'opera, possiamo rimborsarti. Scrivici a info@auctlect.com indicando il titolo dell'opera e l'email del tuo account. Il rimborso avviene sul metodo di pagamento originale e l'opera viene rimossa dalla tua libreria.$q$,
  updated_at = CURRENT_TIMESTAMP
WHERE question_en = 'How do I request a refund?';
