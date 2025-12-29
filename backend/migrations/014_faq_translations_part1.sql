-- =============================================
-- Phase 12-4e: FAQ追加翻訳 Part 1
-- 支払い関連FAQ (4件)
-- =============================================

-- FAQ: Where can I find my receipt?
UPDATE faq_items SET
    question_zh = '我在哪里可以找到收据？',
    answer_zh = '您可以从仪表板的"购买历史"中查看和下载所有购买的收据。每次购买后，收据也会自动发送到您的注册邮箱。',
    question_es = '¿Dónde puedo encontrar mi recibo?',
    answer_es = 'Puede ver y descargar todos los recibos de sus compras desde "Historial de compras" en su panel. Los recibos también se envían automáticamente a su correo registrado después de cada compra.',
    question_fr = 'Où puis-je trouver mon reçu ?',
    answer_fr = 'Vous pouvez consulter et télécharger tous vos reçus depuis "Historique des achats" dans votre tableau de bord. Les reçus sont également envoyés automatiquement à votre e-mail enregistré après chaque achat.',
    question_de = 'Wo finde ich meine Quittung?',
    answer_de = 'Sie können alle Ihre Quittungen unter "Kaufhistorie" in Ihrem Dashboard einsehen und herunterladen. Quittungen werden auch automatisch nach jedem Kauf an Ihre registrierte E-Mail gesendet.',
    question_ko = '영수증은 어디에서 찾을 수 있나요?',
    answer_ko = '대시보드의 "구매 내역"에서 모든 구매 영수증을 확인하고 다운로드할 수 있습니다. 영수증은 구매 후 등록된 이메일로도 자동 발송됩니다.',
    question_ar = 'أين يمكنني العثور على إيصالي؟',
    answer_ar = 'يمكنك عرض وتنزيل جميع إيصالات مشترياتك من "سجل المشتريات" في لوحة التحكم. يتم أيضًا إرسال الإيصالات تلقائيًا إلى بريدك الإلكتروني المسجل بعد كل عملية شراء.',
    question_pt = 'Onde posso encontrar meu recibo?',
    answer_pt = 'Você pode visualizar e baixar todos os recibos de suas compras em "Histórico de compras" no seu painel. Os recibos também são enviados automaticamente para seu e-mail cadastrado após cada compra.'
WHERE question_en = 'Where can I find my receipt?';

-- FAQ: My payment failed
UPDATE faq_items SET
    question_zh = '我的付款失败了',
    answer_zh = '付款失败可能有以下原因：1) 卡片余额不足，2) 卡片已过期，3) 银行拒绝了交易。请检查您的卡片信息并重试，或尝试使用其他支付方式。如果问题持续存在，请联系您的银行或我们的支持团队。',
    question_es = 'Mi pago falló',
    answer_es = 'El pago puede fallar por varias razones: 1) Fondos insuficientes, 2) Tarjeta expirada, 3) El banco rechazó la transacción. Por favor verifique la información de su tarjeta e intente de nuevo, o pruebe con otro método de pago. Si el problema persiste, contacte a su banco o a nuestro equipo de soporte.',
    question_fr = 'Mon paiement a échoué',
    answer_fr = 'Le paiement peut échouer pour plusieurs raisons : 1) Fonds insuffisants, 2) Carte expirée, 3) La banque a refusé la transaction. Veuillez vérifier les informations de votre carte et réessayer, ou essayez un autre mode de paiement. Si le problème persiste, contactez votre banque ou notre équipe de support.',
    question_de = 'Meine Zahlung ist fehlgeschlagen',
    answer_de = 'Die Zahlung kann aus verschiedenen Gründen fehlschlagen: 1) Unzureichendes Guthaben, 2) Abgelaufene Karte, 3) Die Bank hat die Transaktion abgelehnt. Bitte überprüfen Sie Ihre Kartendaten und versuchen Sie es erneut, oder probieren Sie eine andere Zahlungsmethode. Bei anhaltenden Problemen kontaktieren Sie Ihre Bank oder unser Support-Team.',
    question_ko = '결제가 실패했습니다',
    answer_ko = '결제 실패는 여러 이유로 발생할 수 있습니다: 1) 잔액 부족, 2) 카드 만료, 3) 은행에서 거래 거부. 카드 정보를 확인하고 다시 시도하거나 다른 결제 방법을 사용해 주세요. 문제가 계속되면 은행이나 지원팀에 문의하세요.',
    question_ar = 'فشل الدفع الخاص بي',
    answer_ar = 'قد يفشل الدفع لعدة أسباب: 1) رصيد غير كافٍ، 2) بطاقة منتهية الصلاحية، 3) رفض البنك المعاملة. يرجى التحقق من معلومات بطاقتك والمحاولة مرة أخرى، أو جرب طريقة دفع أخرى. إذا استمرت المشكلة، اتصل بالبنك أو فريق الدعم لدينا.',
    question_pt = 'Meu pagamento falhou',
    answer_pt = 'O pagamento pode falhar por vários motivos: 1) Saldo insuficiente, 2) Cartão expirado, 3) O banco recusou a transação. Por favor, verifique as informações do seu cartão e tente novamente, ou experimente outro método de pagamento. Se o problema persistir, entre em contato com seu banco ou nossa equipe de suporte.'
WHERE question_en = 'My payment failed';

-- FAQ: How do I cancel my subscription?
UPDATE faq_items SET
    question_zh = '如何取消订阅？',
    answer_zh = '您可以从仪表板的"设置"→"订阅管理"中随时取消订阅。取消后，您的订阅将在当前计费周期结束前保持有效。取消后不会再收取任何费用。',
    question_es = '¿Cómo cancelo mi suscripción?',
    answer_es = 'Puede cancelar su suscripción en cualquier momento desde "Configuración" → "Gestión de suscripción" en su panel. Después de cancelar, su suscripción permanecerá activa hasta el final del período de facturación actual. No se le cobrará después de la cancelación.',
    question_fr = 'Comment annuler mon abonnement ?',
    answer_fr = 'Vous pouvez annuler votre abonnement à tout moment depuis "Paramètres" → "Gestion de l\'abonnement" dans votre tableau de bord. Après l\'annulation, votre abonnement restera actif jusqu\'à la fin de la période de facturation en cours. Aucun frais ne sera prélevé après l\'annulation.',
    question_de = 'Wie kündige ich mein Abonnement?',
    answer_de = 'Sie können Ihr Abonnement jederzeit unter "Einstellungen" → "Abonnementverwaltung" in Ihrem Dashboard kündigen. Nach der Kündigung bleibt Ihr Abonnement bis zum Ende des aktuellen Abrechnungszeitraums aktiv. Nach der Kündigung werden keine weiteren Gebühren erhoben.',
    question_ko = '구독을 취소하려면 어떻게 해야 하나요?',
    answer_ko = '대시보드의 "설정" → "구독 관리"에서 언제든지 구독을 취소할 수 있습니다. 취소 후에도 현재 결제 기간이 끝날 때까지 구독이 유지됩니다. 취소 후에는 추가 요금이 청구되지 않습니다.',
    question_ar = 'كيف ألغي اشتراكي؟',
    answer_ar = 'يمكنك إلغاء اشتراكك في أي وقت من "الإعدادات" → "إدارة الاشتراك" في لوحة التحكم. بعد الإلغاء، سيظل اشتراكك نشطًا حتى نهاية فترة الفوترة الحالية. لن يتم تحصيل أي رسوم بعد الإلغاء.',
    question_pt = 'Como cancelo minha assinatura?',
    answer_pt = 'Você pode cancelar sua assinatura a qualquer momento em "Configurações" → "Gerenciamento de assinatura" no seu painel. Após o cancelamento, sua assinatura permanecerá ativa até o final do período de cobrança atual. Não haverá cobranças após o cancelamento.'
WHERE question_en = 'How do I cancel my subscription?';

-- FAQ: What currencies do you support?
UPDATE faq_items SET
    question_zh = '你们支持哪些货币？',
    answer_zh = '我们支持多种主要货币，包括美元(USD)、欧元(EUR)、日元(JPY)、英镑(GBP)、人民币(CNY)等。您的账户设置中可以选择首选货币。价格会根据当前汇率自动换算。',
    question_es = '¿Qué monedas aceptan?',
    answer_es = 'Aceptamos varias monedas principales, incluyendo USD, EUR, JPY, GBP, CNY y más. Puede seleccionar su moneda preferida en la configuración de su cuenta. Los precios se convertirán automáticamente según las tasas de cambio actuales.',
    question_fr = 'Quelles devises acceptez-vous ?',
    answer_fr = 'Nous acceptons plusieurs devises principales, notamment USD, EUR, JPY, GBP, CNY et plus. Vous pouvez sélectionner votre devise préférée dans les paramètres de votre compte. Les prix sont automatiquement convertis selon les taux de change actuels.',
    question_de = 'Welche Währungen werden unterstützt?',
    answer_de = 'Wir unterstützen mehrere wichtige Währungen, darunter USD, EUR, JPY, GBP, CNY und mehr. Sie können Ihre bevorzugte Währung in Ihren Kontoeinstellungen auswählen. Die Preise werden automatisch nach aktuellen Wechselkursen umgerechnet.',
    question_ko = '어떤 통화를 지원하나요?',
    answer_ko = 'USD, EUR, JPY, GBP, CNY 등 여러 주요 통화를 지원합니다. 계정 설정에서 원하는 통화를 선택할 수 있습니다. 가격은 현재 환율에 따라 자동으로 변환됩니다.',
    question_ar = 'ما العملات التي تدعمونها؟',
    answer_ar = 'نحن ندعم العديد من العملات الرئيسية بما في ذلك USD و EUR و JPY و GBP و CNY والمزيد. يمكنك تحديد عملتك المفضلة في إعدادات حسابك. يتم تحويل الأسعار تلقائيًا وفقًا لأسعار الصرف الحالية.',
    question_pt = 'Quais moedas vocês aceitam?',
    answer_pt = 'Aceitamos várias moedas principais, incluindo USD, EUR, JPY, GBP, CNY e mais. Você pode selecionar sua moeda preferida nas configurações da sua conta. Os preços são convertidos automaticamente de acordo com as taxas de câmbio atuais.'
WHERE question_en = 'What currencies do you support?';

-- 完了メッセージ
-- Phase 12-4e Part 1: 支払い関連FAQ 4件の翻訳完了
