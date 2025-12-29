-- =============================================
-- Phase 12-4e: FAQ追加翻訳 Part 3
-- 著者・翻訳者向けFAQ (8件)
-- =============================================

-- FAQ: When do I receive my earnings?
UPDATE faq_items SET
    question_zh = '我什么时候能收到收益？',
    answer_zh = '收益在每月15日结算，并在下月1日支付到您的注册支付账户。最低支付金额为50美元。如果未达到最低金额，收益将结转到下个月。',
    question_es = '¿Cuándo recibo mis ganancias?',
    answer_es = 'Las ganancias se calculan el día 15 de cada mes y se pagan el día 1 del mes siguiente a su cuenta de pago registrada. El monto mínimo de pago es $50 USD. Si no alcanza el mínimo, las ganancias se acumulan para el próximo mes.',
    question_fr = 'Quand est-ce que je reçois mes revenus ?',
    answer_fr = 'Les revenus sont calculés le 15 de chaque mois et payés le 1er du mois suivant sur votre compte de paiement enregistré. Le montant minimum de paiement est de 50 $ USD. Si vous n''atteignez pas le minimum, les revenus sont reportés au mois suivant.',
    question_de = 'Wann erhalte ich meine Einnahmen?',
    answer_de = 'Die Einnahmen werden am 15. jedes Monats berechnet und am 1. des Folgemonats auf Ihr registriertes Zahlungskonto ausgezahlt. Der Mindestauszahlungsbetrag beträgt 50 USD. Wenn Sie das Minimum nicht erreichen, werden die Einnahmen auf den nächsten Monat übertragen.',
    question_ko = '수익은 언제 받을 수 있나요?',
    answer_ko = '수익은 매월 15일에 정산되어 다음 달 1일에 등록된 결제 계좌로 지급됩니다. 최소 지급 금액은 50달러입니다. 최소 금액에 도달하지 못하면 수익은 다음 달로 이월됩니다.',
    question_ar = 'متى أستلم أرباحي؟',
    answer_ar = 'يتم حساب الأرباح في اليوم 15 من كل شهر وتُدفع في اليوم الأول من الشهر التالي إلى حساب الدفع المسجل. الحد الأدنى للدفع هو 50 دولار أمريكي. إذا لم تصل إلى الحد الأدنى، تُرحل الأرباح للشهر التالي.',
    question_pt = 'Quando recebo meus ganhos?',
    answer_pt = 'Os ganhos são calculados no dia 15 de cada mês e pagos no dia 1º do mês seguinte na sua conta de pagamento cadastrada. O valor mínimo de pagamento é $50 USD. Se você não atingir o mínimo, os ganhos são transferidos para o próximo mês.'
WHERE question_en = 'When do I receive my earnings?';

-- FAQ: What is the revenue sharing structure?
UPDATE faq_items SET
    question_zh = '收益分成结构是怎样的？',
    answer_zh = '作者获得销售额的40-70%（取决于定价和订阅类型）。翻译者获得翻译作品销售额的20%。编辑者获得10%。平台保留30%用于运营和推广。',
    question_es = '¿Cuál es la estructura de reparto de ingresos?',
    answer_es = 'Los autores reciben 40-70% de las ventas (dependiendo del precio y tipo de suscripción). Los traductores reciben 20% de las ventas de obras traducidas. Los editores reciben 10%. La plataforma retiene 30% para operaciones y promoción.',
    question_fr = 'Quelle est la structure de partage des revenus ?',
    answer_fr = 'Les auteurs reçoivent 40 à 70 % des ventes (selon le prix et le type d''abonnement). Les traducteurs reçoivent 20 % des ventes des œuvres traduites. Les éditeurs reçoivent 10 %. La plateforme conserve 30 % pour les opérations et la promotion.',
    question_de = 'Wie ist die Umsatzbeteiligungsstruktur?',
    answer_de = 'Autoren erhalten 40-70% des Verkaufserlöses (abhängig von Preis und Abonnementtyp). Übersetzer erhalten 20% der Verkäufe übersetzter Werke. Redakteure erhalten 10%. Die Plattform behält 30% für Betrieb und Werbung.',
    question_ko = '수익 분배 구조는 어떻게 되나요?',
    answer_ko = '저자는 판매액의 40-70%를 받습니다(가격 및 구독 유형에 따라 다름). 번역가는 번역 작품 판매액의 20%를 받습니다. 편집자는 10%를 받습니다. 플랫폼은 운영 및 홍보를 위해 30%를 유지합니다.',
    question_ar = 'ما هو هيكل تقاسم الإيرادات؟',
    answer_ar = 'يحصل المؤلفون على 40-70% من المبيعات (حسب السعر ونوع الاشتراك). يحصل المترجمون على 20% من مبيعات الأعمال المترجمة. يحصل المحررون على 10%. تحتفظ المنصة بـ 30% للعمليات والترويج.',
    question_pt = 'Qual é a estrutura de divisão de receitas?',
    answer_pt = 'Autores recebem 40-70% das vendas (dependendo do preço e tipo de assinatura). Tradutores recebem 20% das vendas de obras traduzidas. Editores recebem 10%. A plataforma retém 30% para operações e promoção.'
WHERE question_en = 'What is the revenue sharing structure?';

-- FAQ: Can I set my own price?
UPDATE faq_items SET
    question_zh = '我可以自己设定价格吗？',
    answer_zh = '是的，作者可以在0.99美元到99.99美元之间自由设定作品价格。您也可以选择免费发布或设置限时折扣。建议参考类似作品的定价。',
    question_es = '¿Puedo establecer mi propio precio?',
    answer_es = 'Sí, los autores pueden establecer libremente precios para sus obras entre $0.99 y $99.99 USD. También puede elegir publicar gratis o establecer descuentos por tiempo limitado. Recomendamos revisar precios de obras similares como referencia.',
    question_fr = 'Puis-je fixer mon propre prix ?',
    answer_fr = 'Oui, les auteurs peuvent fixer librement les prix de leurs œuvres entre 0,99 $ et 99,99 $ USD. Vous pouvez également choisir de publier gratuitement ou de définir des remises à durée limitée. Nous recommandons de consulter les prix d''œuvres similaires comme référence.',
    question_de = 'Kann ich meinen eigenen Preis festlegen?',
    answer_de = 'Ja, Autoren können Preise für ihre Werke frei zwischen 0,99 $ und 99,99 $ USD festlegen. Sie können auch wählen, kostenlos zu veröffentlichen oder zeitlich begrenzte Rabatte festzulegen. Wir empfehlen, Preise ähnlicher Werke als Referenz zu prüfen.',
    question_ko = '가격을 직접 설정할 수 있나요?',
    answer_ko = '네, 저자는 $0.99에서 $99.99 USD 사이에서 작품 가격을 자유롭게 설정할 수 있습니다. 무료로 출판하거나 기간 한정 할인을 설정할 수도 있습니다. 유사한 작품의 가격을 참고하시기 바랍니다.',
    question_ar = 'هل يمكنني تحديد السعر الخاص بي؟',
    answer_ar = 'نعم، يمكن للمؤلفين تحديد أسعار أعمالهم بحرية بين 0.99 دولار و 99.99 دولار أمريكي. يمكنك أيضًا اختيار النشر مجانًا أو تعيين خصومات لفترة محدودة. نوصي بمراجعة أسعار الأعمال المماثلة كمرجع.',
    question_pt = 'Posso definir meu próprio preço?',
    answer_pt = 'Sim, autores podem definir livremente preços para suas obras entre $0.99 e $99.99 USD. Você também pode optar por publicar gratuitamente ou definir descontos por tempo limitado. Recomendamos verificar preços de obras similares como referência.'
WHERE question_en = 'Can I set my own price?';

-- FAQ: Who owns the copyright?
UPDATE faq_items SET
    question_zh = '版权归谁所有？',
    answer_zh = '您保留对您作品的完全版权所有权。通过在我们平台发布，您只是授予我们非独家分发许可。您可以随时将作品下架，也可以在其他平台同时发布。',
    question_es = '¿Quién posee los derechos de autor?',
    answer_es = 'Usted conserva la propiedad total de los derechos de autor de su trabajo. Al publicar en nuestra plataforma, simplemente nos otorga una licencia de distribución no exclusiva. Puede retirar su trabajo en cualquier momento y publicar simultáneamente en otras plataformas.',
    question_fr = 'À qui appartiennent les droits d''auteur ?',
    answer_fr = 'Vous conservez la pleine propriété des droits d''auteur sur votre travail. En publiant sur notre plateforme, vous nous accordez simplement une licence de distribution non exclusive. Vous pouvez retirer votre travail à tout moment et publier simultanément sur d''autres plateformes.',
    question_de = 'Wem gehört das Urheberrecht?',
    answer_de = 'Sie behalten das vollständige Urheberrecht an Ihrem Werk. Durch die Veröffentlichung auf unserer Plattform erteilen Sie uns lediglich eine nicht-exklusive Vertriebslizenz. Sie können Ihr Werk jederzeit entfernen und gleichzeitig auf anderen Plattformen veröffentlichen.',
    question_ko = '저작권은 누구에게 있나요?',
    answer_ko = '귀하는 작품에 대한 완전한 저작권 소유권을 유지합니다. 우리 플랫폼에 출판함으로써 귀하는 단순히 비독점적 배포 라이선스를 부여하는 것입니다. 언제든지 작품을 철회할 수 있으며 다른 플랫폼에서도 동시에 출판할 수 있습니다.',
    question_ar = 'من يملك حقوق النشر؟',
    answer_ar = 'تحتفظ بملكية حقوق النشر الكاملة لعملك. بالنشر على منصتنا، فإنك تمنحنا ببساطة ترخيص توزيع غير حصري. يمكنك سحب عملك في أي وقت والنشر في وقت واحد على منصات أخرى.',
    question_pt = 'Quem detém os direitos autorais?',
    answer_pt = 'Você mantém a propriedade total dos direitos autorais do seu trabalho. Ao publicar em nossa plataforma, você simplesmente nos concede uma licença de distribuição não exclusiva. Você pode retirar seu trabalho a qualquer momento e publicar simultaneamente em outras plataformas.'
WHERE question_en = 'Who owns the copyright?';

-- FAQ: How do I register as a translator?
UPDATE faq_items SET
    question_zh = '如何注册成为翻译人员？',
    answer_zh = '点击"成为翻译者"页面进行注册。您需要提供语言能力证明（证书或测试分数）、翻译样本和个人简介。申请将在3-5个工作日内审核。',
    question_es = '¿Cómo me registro como traductor?',
    answer_es = 'Haga clic en la página "Convertirse en traductor" para registrarse. Deberá proporcionar prueba de competencia lingüística (certificados o puntajes de pruebas), muestras de traducción y una biografía. Las solicitudes se revisan dentro de 3-5 días hábiles.',
    question_fr = 'Comment m''inscrire en tant que traducteur ?',
    answer_fr = 'Cliquez sur la page "Devenir traducteur" pour vous inscrire. Vous devrez fournir une preuve de compétence linguistique (certificats ou scores de tests), des échantillons de traduction et une biographie. Les candidatures sont examinées dans les 3 à 5 jours ouvrables.',
    question_de = 'Wie registriere ich mich als Übersetzer?',
    answer_de = 'Klicken Sie auf die Seite "Übersetzer werden", um sich zu registrieren. Sie müssen einen Nachweis der Sprachkompetenz (Zertifikate oder Testergebnisse), Übersetzungsproben und eine Biografie vorlegen. Bewerbungen werden innerhalb von 3-5 Werktagen geprüft.',
    question_ko = '번역가로 등록하려면 어떻게 해야 하나요?',
    answer_ko = '"번역가 되기" 페이지를 클릭하여 등록하세요. 언어 능력 증명(자격증 또는 시험 점수), 번역 샘플 및 자기소개서를 제공해야 합니다. 신청은 3-5 영업일 이내에 검토됩니다.',
    question_ar = 'كيف أسجل كمترجم؟',
    answer_ar = 'انقر على صفحة "كن مترجمًا" للتسجيل. ستحتاج إلى تقديم إثبات الكفاءة اللغوية (شهادات أو درجات اختبار) وعينات ترجمة وسيرة ذاتية. تتم مراجعة الطلبات في غضون 3-5 أيام عمل.',
    question_pt = 'Como me registro como tradutor?',
    answer_pt = 'Clique na página "Tornar-se tradutor" para se registrar. Você precisará fornecer comprovante de proficiência linguística (certificados ou pontuações de testes), amostras de tradução e uma biografia. As inscrições são analisadas dentro de 3-5 dias úteis.'
WHERE question_en = 'How do I register as a translator?';

-- FAQ: How is translator compensation calculated?
UPDATE faq_items SET
    question_zh = '翻译人员的报酬是如何计算的？',
    answer_zh = '翻译人员从翻译作品销售额中获得20%。对于直接委托项目，费率由翻译人员和客户协商确定。平台收取项目费用的15%作为服务费。',
    question_es = '¿Cómo se calcula la compensación del traductor?',
    answer_es = 'Los traductores reciben 20% de las ventas de obras traducidas. Para proyectos de encargo directo, las tarifas se negocian entre el traductor y el cliente. La plataforma cobra 15% de la tarifa del proyecto como comisión de servicio.',
    question_fr = 'Comment la rémunération des traducteurs est-elle calculée ?',
    answer_fr = 'Les traducteurs reçoivent 20 % des ventes des œuvres traduites. Pour les projets de commande directe, les tarifs sont négociés entre le traducteur et le client. La plateforme prélève 15 % des frais de projet comme commission de service.',
    question_de = 'Wie wird die Vergütung für Übersetzer berechnet?',
    answer_de = 'Übersetzer erhalten 20% der Verkäufe übersetzter Werke. Bei Direktaufträgen werden die Sätze zwischen Übersetzer und Kunde ausgehandelt. Die Plattform erhebt 15% der Projektgebühr als Servicegebühr.',
    question_ko = '번역가 보수는 어떻게 계산되나요?',
    answer_ko = '번역가는 번역 작품 판매액의 20%를 받습니다. 직접 의뢰 프로젝트의 경우 요금은 번역가와 클라이언트 간에 협상됩니다. 플랫폼은 프로젝트 비용의 15%를 서비스 수수료로 청구합니다.',
    question_ar = 'كيف يتم حساب تعويض المترجم؟',
    answer_ar = 'يحصل المترجمون على 20% من مبيعات الأعمال المترجمة. بالنسبة لمشاريع التكليف المباشر، يتم التفاوض على الأسعار بين المترجم والعميل. تفرض المنصة 15% من رسوم المشروع كعمولة خدمة.',
    question_pt = 'Como é calculada a remuneração do tradutor?',
    answer_pt = 'Tradutores recebem 20% das vendas de obras traduzidas. Para projetos de encomenda direta, as taxas são negociadas entre o tradutor e o cliente. A plataforma cobra 15% da taxa do projeto como comissão de serviço.'
WHERE question_en = 'How is translator compensation calculated?';

-- FAQ: How do I find translation jobs?
UPDATE faq_items SET
    question_zh = '如何找到翻译工作？',
    answer_zh = '在您的翻译者仪表板中，点击"可用项目"查看匹配您语言对的开放翻译请求。您也可以设置通知，当有新项目符合您条件时会收到提醒。',
    question_es = '¿Cómo encuentro trabajos de traducción?',
    answer_es = 'En su panel de traductor, haga clic en "Proyectos disponibles" para ver solicitudes de traducción abiertas que coincidan con sus pares de idiomas. También puede configurar notificaciones para recibir alertas cuando haya nuevos proyectos que coincidan con sus criterios.',
    question_fr = 'Comment trouver des travaux de traduction ?',
    answer_fr = 'Dans votre tableau de bord de traducteur, cliquez sur "Projets disponibles" pour voir les demandes de traduction ouvertes correspondant à vos paires de langues. Vous pouvez également configurer des notifications pour recevoir des alertes lorsque de nouveaux projets correspondent à vos critères.',
    question_de = 'Wie finde ich Übersetzungsaufträge?',
    answer_de = 'Klicken Sie in Ihrem Übersetzer-Dashboard auf "Verfügbare Projekte", um offene Übersetzungsanfragen für Ihre Sprachpaare anzuzeigen. Sie können auch Benachrichtigungen einrichten, um Alerts zu erhalten, wenn neue Projekte Ihren Kriterien entsprechen.',
    question_ko = '번역 일자리를 어떻게 찾나요?',
    answer_ko = '번역가 대시보드에서 "가능한 프로젝트"를 클릭하면 언어 쌍에 맞는 열린 번역 요청을 볼 수 있습니다. 조건에 맞는 새 프로젝트가 있을 때 알림을 받도록 설정할 수도 있습니다.',
    question_ar = 'كيف أجد وظائف الترجمة؟',
    answer_ar = 'في لوحة تحكم المترجم، انقر على "المشاريع المتاحة" لعرض طلبات الترجمة المفتوحة التي تتطابق مع أزواج لغاتك. يمكنك أيضًا إعداد إشعارات لتلقي تنبيهات عند وجود مشاريع جديدة تتطابق مع معاييرك.',
    question_pt = 'Como encontro trabalhos de tradução?',
    answer_pt = 'No seu painel de tradutor, clique em "Projetos disponíveis" para ver solicitações de tradução abertas que correspondam aos seus pares de idiomas. Você também pode configurar notificações para receber alertas quando novos projetos corresponderem aos seus critérios.'
WHERE question_en = 'How do I find translation jobs?';

-- FAQ: How can I make my translator profile attractive?
UPDATE faq_items SET
    question_zh = '如何让我的翻译者资料更有吸引力？',
    answer_zh = '完善您的个人资料：添加专业头像、详细的语言技能和专业领域、过往翻译作品样本、相关资质证书，以及过往客户的评价。保持快速响应也很重要。',
    question_es = '¿Cómo puedo hacer mi perfil de traductor atractivo?',
    answer_es = 'Complete su perfil: agregue una foto profesional, habilidades lingüísticas detalladas y especialidades, muestras de trabajos de traducción anteriores, certificaciones relevantes y reseñas de clientes anteriores. Mantener tiempos de respuesta rápidos también es importante.',
    question_fr = 'Comment rendre mon profil de traducteur attractif ?',
    answer_fr = 'Complétez votre profil : ajoutez une photo professionnelle, des compétences linguistiques et des spécialités détaillées, des échantillons de travaux de traduction précédents, des certifications pertinentes et des avis de clients précédents. Maintenir des temps de réponse rapides est également important.',
    question_de = 'Wie kann ich mein Übersetzer-Profil attraktiv gestalten?',
    answer_de = 'Vervollständigen Sie Ihr Profil: Fügen Sie ein professionelles Foto, detaillierte Sprachkenntnisse und Fachgebiete, Proben früherer Übersetzungsarbeiten, relevante Zertifizierungen und Bewertungen früherer Kunden hinzu. Schnelle Reaktionszeiten sind ebenfalls wichtig.',
    question_ko = '번역가 프로필을 어떻게 매력적으로 만들 수 있나요?',
    answer_ko = '프로필을 완성하세요: 전문적인 사진, 상세한 언어 능력 및 전문 분야, 이전 번역 작업 샘플, 관련 자격증, 이전 고객의 리뷰를 추가하세요. 빠른 응답 시간을 유지하는 것도 중요합니다.',
    question_ar = 'كيف أجعل ملفي الشخصي كمترجم جذابًا؟',
    answer_ar = 'أكمل ملفك الشخصي: أضف صورة احترافية، ومهارات لغوية وتخصصات مفصلة، وعينات من أعمال الترجمة السابقة، والشهادات ذات الصلة، ومراجعات العملاء السابقين. الحفاظ على أوقات استجابة سريعة مهم أيضًا.',
    question_pt = 'Como posso tornar meu perfil de tradutor atraente?',
    answer_pt = 'Complete seu perfil: adicione uma foto profissional, habilidades linguísticas e especialidades detalhadas, amostras de trabalhos de tradução anteriores, certificações relevantes e avaliações de clientes anteriores. Manter tempos de resposta rápidos também é importante.'
WHERE question_en = 'How can I make my translator profile attractive?';

-- 完了メッセージ
-- Phase 12-4e Part 3: 著者・翻訳者向けFAQ 8件の翻訳完了
