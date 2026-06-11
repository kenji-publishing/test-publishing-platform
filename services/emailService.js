/**
 * AuctLect - Email Notification Service
 * メール通知サービス
 * 
 * 配置先: C:\Projects\test-publishing-platform\services\emailService.js
 * 
 * 必要なパッケージ:
 * npm install nodemailer --save
 */

const nodemailer = require('nodemailer');

// ========== 設定 ==========
const config = {
    // SMTP設定（環境変数から取得）
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-app-password'
        }
    },
    // 送信元
    from: {
        name: 'AuctLect',
        address: process.env.SMTP_FROM || 'noreply@publisher.com'
    },
    // サイトURL
    siteUrl: process.env.SITE_URL || 'http://localhost:8000'
};

// ========== メールトランスポーター ==========
const transporter = nodemailer.createTransport(config.smtp);

// ========== メールテンプレート（9言語対応）==========
const emailTemplates = {
    // 作品購入通知
    sale: {
        subject: {
            en: '💰 Your work was purchased!',
            ja: '💰 あなたの作品が購入されました！',
            zh: '💰 您的作品已售出！',
            es: '💰 ¡Tu obra fue comprada!',
            fr: '💰 Votre œuvre a été achetée !',
            de: '💰 Ihr Werk wurde gekauft!',
            ko: '💰 작품이 판매되었습니다!',
            ar: '💰 تم شراء عملك!',
            pt: '💰 Sua obra foi vendida!'
        },
        body: {
            en: `
                <h2>Great news! 🎉</h2>
                <p>Your work <strong>"{work}"</strong> was purchased.</p>
                <p>You earned: <strong>{amount}</strong></p>
                <p>Keep up the great work!</p>
            `,
            ja: `
                <h2>おめでとうございます！ 🎉</h2>
                <p>あなたの作品「<strong>{work}</strong>」が購入されました。</p>
                <p>獲得金額: <strong>{amount}</strong></p>
                <p>これからも素晴らしい作品をお願いします！</p>
            `,
            zh: `
                <h2>好消息！ 🎉</h2>
                <p>您的作品《<strong>{work}</strong>》已售出。</p>
                <p>您获得了: <strong>{amount}</strong></p>
                <p>继续创作精彩作品！</p>
            `,
            es: `
                <h2>¡Grandes noticias! 🎉</h2>
                <p>Tu obra <strong>"{work}"</strong> fue comprada.</p>
                <p>Ganaste: <strong>{amount}</strong></p>
                <p>¡Sigue con el gran trabajo!</p>
            `,
            fr: `
                <h2>Bonne nouvelle ! 🎉</h2>
                <p>Votre œuvre <strong>« {work} »</strong> a été achetée.</p>
                <p>Vous avez gagné : <strong>{amount}</strong></p>
                <p>Continuez votre excellent travail !</p>
            `,
            de: `
                <h2>Tolle Neuigkeiten! 🎉</h2>
                <p>Ihr Werk <strong>„{work}"</strong> wurde gekauft.</p>
                <p>Sie haben verdient: <strong>{amount}</strong></p>
                <p>Machen Sie weiter so!</p>
            `,
            ko: `
                <h2>좋은 소식입니다! 🎉</h2>
                <p>작품 <strong>「{work}」</strong>이(가) 판매되었습니다.</p>
                <p>획득 금액: <strong>{amount}</strong></p>
                <p>앞으로도 좋은 작품 부탁드립니다!</p>
            `,
            ar: `
                <h2>أخبار رائعة! 🎉</h2>
                <p>تم شراء عملك <strong>"{work}"</strong>.</p>
                <p>لقد ربحت: <strong>{amount}</strong></p>
                <p>استمر في العمل الرائع!</p>
            `,
            pt: `
                <h2>Ótimas notícias! 🎉</h2>
                <p>Sua obra <strong>"{work}"</strong> foi comprada.</p>
                <p>Você ganhou: <strong>{amount}</strong></p>
                <p>Continue com o ótimo trabalho!</p>
            `
        }
    },
    
    // 翻訳完了通知
    translation_complete: {
        subject: {
            en: '🌐 Translation completed!',
            ja: '🌐 翻訳が完了しました！',
            zh: '🌐 翻译已完成！',
            es: '🌐 ¡Traducción completada!',
            fr: '🌐 Traduction terminée !',
            de: '🌐 Übersetzung abgeschlossen!',
            ko: '🌐 번역이 완료되었습니다!',
            ar: '🌐 اكتملت الترجمة!',
            pt: '🌐 Tradução concluída!'
        },
        body: {
            en: `
                <h2>Translation Complete! 🎉</h2>
                <p>The <strong>{language}</strong> translation of <strong>"{work}"</strong> is now complete.</p>
                <p>Your work can now reach a wider audience!</p>
            `,
            ja: `
                <h2>翻訳完了！ 🎉</h2>
                <p>「<strong>{work}</strong>」の<strong>{language}</strong>翻訳が完了しました。</p>
                <p>あなたの作品がより多くの読者に届くようになりました！</p>
            `,
            zh: `
                <h2>翻译完成！ 🎉</h2>
                <p>《<strong>{work}</strong>》的<strong>{language}</strong>翻译已完成。</p>
                <p>您的作品现在可以触达更广泛的读者！</p>
            `,
            es: `
                <h2>¡Traducción completada! 🎉</h2>
                <p>La traducción al <strong>{language}</strong> de <strong>"{work}"</strong> está lista.</p>
                <p>¡Tu obra ahora puede llegar a más lectores!</p>
            `,
            fr: `
                <h2>Traduction terminée ! 🎉</h2>
                <p>La traduction en <strong>{language}</strong> de <strong>« {work} »</strong> est terminée.</p>
                <p>Votre œuvre peut maintenant atteindre un public plus large !</p>
            `,
            de: `
                <h2>Übersetzung abgeschlossen! 🎉</h2>
                <p>Die <strong>{language}</strong> Übersetzung von <strong>„{work}"</strong> ist fertig.</p>
                <p>Ihr Werk kann jetzt ein breiteres Publikum erreichen!</p>
            `,
            ko: `
                <h2>번역 완료! 🎉</h2>
                <p><strong>「{work}」</strong>의 <strong>{language}</strong> 번역이 완료되었습니다.</p>
                <p>더 많은 독자에게 작품이 전달될 수 있습니다!</p>
            `,
            ar: `
                <h2>اكتملت الترجمة! 🎉</h2>
                <p>اكتملت ترجمة <strong>"{work}"</strong> إلى <strong>{language}</strong>.</p>
                <p>يمكن لعملك الآن الوصول إلى جمهور أوسع!</p>
            `,
            pt: `
                <h2>Tradução concluída! 🎉</h2>
                <p>A tradução para <strong>{language}</strong> de <strong>"{work}"</strong> está pronta.</p>
                <p>Sua obra agora pode alcançar mais leitores!</p>
            `
        }
    },
    
    // フィードバック通知
    feedback: {
        subject: {
            en: '⭐ New feedback on your work!',
            ja: '⭐ 作品にフィードバックが届きました！',
            zh: '⭐ 您的作品收到了新反馈！',
            es: '⭐ ¡Nuevo feedback en tu obra!',
            fr: '⭐ Nouveau retour sur votre œuvre !',
            de: '⭐ Neues Feedback zu Ihrem Werk!',
            ko: '⭐ 작품에 피드백이 도착했습니다!',
            ar: '⭐ تعليق جديد على عملك!',
            pt: '⭐ Novo feedback na sua obra!'
        },
        body: {
            en: `
                <h2>You received feedback! ⭐</h2>
                <p>Your work <strong>"{work}"</strong> received a <strong>{rating}-star</strong> rating!</p>
                <p>Readers are loving your work!</p>
            `,
            ja: `
                <h2>フィードバックを受け取りました！ ⭐</h2>
                <p>「<strong>{work}</strong>」が<strong>{rating}つ星</strong>の評価を受けました！</p>
                <p>読者があなたの作品を気に入っています！</p>
            `,
            zh: `
                <h2>收到反馈！ ⭐</h2>
                <p>《<strong>{work}</strong>》获得了<strong>{rating}星</strong>评价！</p>
                <p>读者们喜欢您的作品！</p>
            `,
            es: `
                <h2>¡Recibiste feedback! ⭐</h2>
                <p>Tu obra <strong>"{work}"</strong> recibió una calificación de <strong>{rating} estrellas</strong>!</p>
                <p>¡A los lectores les encanta tu trabajo!</p>
            `,
            fr: `
                <h2>Vous avez reçu un retour ! ⭐</h2>
                <p>Votre œuvre <strong>« {work} »</strong> a reçu une note de <strong>{rating} étoiles</strong> !</p>
                <p>Les lecteurs adorent votre travail !</p>
            `,
            de: `
                <h2>Sie haben Feedback erhalten! ⭐</h2>
                <p>Ihr Werk <strong>„{work}"</strong> hat eine <strong>{rating}-Sterne</strong> Bewertung erhalten!</p>
                <p>Die Leser lieben Ihre Arbeit!</p>
            `,
            ko: `
                <h2>피드백을 받았습니다! ⭐</h2>
                <p><strong>「{work}」</strong>이(가) <strong>{rating}점</strong> 평가를 받았습니다!</p>
                <p>독자들이 작품을 좋아합니다!</p>
            `,
            ar: `
                <h2>تلقيت تعليقًا! ⭐</h2>
                <p>حصل عملك <strong>"{work}"</strong> على تقييم <strong>{rating} نجوم</strong>!</p>
                <p>القراء يحبون عملك!</p>
            `,
            pt: `
                <h2>Você recebeu feedback! ⭐</h2>
                <p>Sua obra <strong>"{work}"</strong> recebeu uma avaliação de <strong>{rating} estrelas</strong>!</p>
                <p>Os leitores estão adorando seu trabalho!</p>
            `
        }
    },
    
    // コメント通知
    comment: {
        subject: {
            en: '💬 New comment on your work!',
            ja: '💬 作品にコメントが届きました！',
            zh: '💬 您的作品收到了新评论！',
            es: '💬 ¡Nuevo comentario en tu obra!',
            fr: '💬 Nouveau commentaire sur votre œuvre !',
            de: '💬 Neuer Kommentar zu Ihrem Werk!',
            ko: '💬 작품에 댓글이 달렸습니다!',
            ar: '💬 تعليق جديد على عملك!',
            pt: '💬 Novo comentário na sua obra!'
        },
        body: {
            en: `
                <h2>New Comment! 💬</h2>
                <p>Someone commented on your work <strong>"{work}"</strong>.</p>
                <p>Check it out and engage with your readers!</p>
            `,
            ja: `
                <h2>新しいコメント！ 💬</h2>
                <p>「<strong>{work}</strong>」にコメントが投稿されました。</p>
                <p>読者と交流しましょう！</p>
            `,
            zh: `
                <h2>新评论！ 💬</h2>
                <p>有人评论了您的作品《<strong>{work}</strong>》。</p>
                <p>去看看并与读者互动吧！</p>
            `,
            es: `
                <h2>¡Nuevo comentario! 💬</h2>
                <p>Alguien comentó en tu obra <strong>"{work}"</strong>.</p>
                <p>¡Míralo e interactúa con tus lectores!</p>
            `,
            fr: `
                <h2>Nouveau commentaire ! 💬</h2>
                <p>Quelqu'un a commenté votre œuvre <strong>« {work} »</strong>.</p>
                <p>Allez voir et échangez avec vos lecteurs !</p>
            `,
            de: `
                <h2>Neuer Kommentar! 💬</h2>
                <p>Jemand hat Ihr Werk <strong>„{work}"</strong> kommentiert.</p>
                <p>Schauen Sie es sich an und interagieren Sie mit Ihren Lesern!</p>
            `,
            ko: `
                <h2>새 댓글! 💬</h2>
                <p><strong>「{work}」</strong>에 댓글이 달렸습니다.</p>
                <p>독자들과 소통해보세요!</p>
            `,
            ar: `
                <h2>تعليق جديد! 💬</h2>
                <p>علق شخص ما على عملك <strong>"{work}"</strong>.</p>
                <p>اطلع عليه وتفاعل مع قرائك!</p>
            `,
            pt: `
                <h2>Novo comentário! 💬</h2>
                <p>Alguém comentou na sua obra <strong>"{work}"</strong>.</p>
                <p>Confira e interaja com seus leitores!</p>
            `
        }
    },
    
    // ウェルカムメール
    welcome: {
        subject: {
            en: '🎉 Welcome to AuctLect!',
            ja: '🎉 AuctLectへようこそ！',
            zh: '🎉 欢迎来到AuctLect！',
            es: '🎉 ¡Bienvenido a AuctLect!',
            fr: '🎉 Bienvenue sur AuctLect !',
            de: '🎉 Willkommen bei AuctLect!',
            ko: '🎉 AuctLect에 오신 것을 환영합니다!',
            ar: '🎉 مرحبًا بك في AuctLect!',
            pt: '🎉 Bem-vindo ao AuctLect!'
        },
        body: {
            en: `
                <h2>Welcome to AuctLect! 🎉</h2>
                <p>Hi <strong>{name}</strong>,</p>
                <p>Your account is ready. You can now:</p>
                <ul>
                    <li>Upload and publish your works</li>
                    <li>Translate your content to 9 languages</li>
                    <li>Connect with readers worldwide</li>
                    <li>Earn money from your creations</li>
                </ul>
                <p>Start your publishing journey today!</p>
            `,
            ja: `
                <h2>AuctLectへようこそ！ 🎉</h2>
                <p><strong>{name}</strong>さん、こんにちは。</p>
                <p>アカウントの準備ができました。これからできること：</p>
                <ul>
                    <li>作品のアップロードと公開</li>
                    <li>9言語への翻訳</li>
                    <li>世界中の読者とつながる</li>
                    <li>作品から収益を得る</li>
                </ul>
                <p>さあ、出版の旅を始めましょう！</p>
            `,
            zh: `
                <h2>欢迎来到AuctLect！ 🎉</h2>
                <p><strong>{name}</strong>，您好！</p>
                <p>您的账户已准备就绪。现在您可以：</p>
                <ul>
                    <li>上传并发布您的作品</li>
                    <li>将内容翻译成9种语言</li>
                    <li>与全球读者建立联系</li>
                    <li>从创作中获得收入</li>
                </ul>
                <p>今天就开始您的出版之旅吧！</p>
            `,
            es: `
                <h2>¡Bienvenido a AuctLect! 🎉</h2>
                <p>Hola <strong>{name}</strong>,</p>
                <p>Tu cuenta está lista. Ahora puedes:</p>
                <ul>
                    <li>Subir y publicar tus obras</li>
                    <li>Traducir tu contenido a 9 idiomas</li>
                    <li>Conectar con lectores de todo el mundo</li>
                    <li>Ganar dinero con tus creaciones</li>
                </ul>
                <p>¡Comienza tu viaje de publicación hoy!</p>
            `,
            fr: `
                <h2>Bienvenue sur AuctLect ! 🎉</h2>
                <p>Bonjour <strong>{name}</strong>,</p>
                <p>Votre compte est prêt. Vous pouvez maintenant :</p>
                <ul>
                    <li>Télécharger et publier vos œuvres</li>
                    <li>Traduire votre contenu en 9 langues</li>
                    <li>Vous connecter avec des lecteurs du monde entier</li>
                    <li>Gagner de l'argent avec vos créations</li>
                </ul>
                <p>Commencez votre aventure éditoriale aujourd'hui !</p>
            `,
            de: `
                <h2>Willkommen bei AuctLect! 🎉</h2>
                <p>Hallo <strong>{name}</strong>,</p>
                <p>Ihr Konto ist bereit. Sie können jetzt:</p>
                <ul>
                    <li>Ihre Werke hochladen und veröffentlichen</li>
                    <li>Ihre Inhalte in 9 Sprachen übersetzen</li>
                    <li>Mit Lesern weltweit in Kontakt treten</li>
                    <li>Mit Ihren Kreationen Geld verdienen</li>
                </ul>
                <p>Starten Sie heute Ihre Veröffentlichungsreise!</p>
            `,
            ko: `
                <h2>AuctLect에 오신 것을 환영합니다! 🎉</h2>
                <p><strong>{name}</strong>님, 안녕하세요.</p>
                <p>계정이 준비되었습니다. 이제 다음을 할 수 있습니다:</p>
                <ul>
                    <li>작품 업로드 및 출판</li>
                    <li>9개 언어로 콘텐츠 번역</li>
                    <li>전 세계 독자와 연결</li>
                    <li>창작물로 수익 창출</li>
                </ul>
                <p>오늘 출판 여정을 시작하세요!</p>
            `,
            ar: `
                <h2>مرحبًا بك في AuctLect! 🎉</h2>
                <p>مرحبًا <strong>{name}</strong>،</p>
                <p>حسابك جاهز. يمكنك الآن:</p>
                <ul>
                    <li>تحميل ونشر أعمالك</li>
                    <li>ترجمة محتواك إلى 9 لغات</li>
                    <li>التواصل مع القراء في جميع أنحاء العالم</li>
                    <li>كسب المال من إبداعاتك</li>
                </ul>
                <p>ابدأ رحلة النشر اليوم!</p>
            `,
            pt: `
                <h2>Bem-vindo ao AuctLect! 🎉</h2>
                <p>Olá <strong>{name}</strong>,</p>
                <p>Sua conta está pronta. Agora você pode:</p>
                <ul>
                    <li>Fazer upload e publicar suas obras</li>
                    <li>Traduzir seu conteúdo para 9 idiomas</li>
                    <li>Conectar-se com leitores do mundo todo</li>
                    <li>Ganhar dinheiro com suas criações</li>
                </ul>
                <p>Comece sua jornada de publicação hoje!</p>
            `
        }
    }
};

// ========== HTML メールラッパー ==========
function wrapInEmailTemplate(content, lang = 'en') {
    const footerText = {
        en: 'This email was sent by AuctLect. If you no longer wish to receive these emails, please update your notification settings.',
        ja: 'このメールはAuctLectから送信されました。今後このようなメールを受け取りたくない場合は、通知設定を更新してください。',
        zh: '此邮件由AuctLect发送。如果您不想再收到此类邮件，请更新您的通知设置。',
        es: 'Este correo fue enviado por AuctLect. Si no deseas recibir estos correos, actualiza tu configuración de notificaciones.',
        fr: 'Cet email a été envoyé par AuctLect. Si vous ne souhaitez plus recevoir ces emails, veuillez mettre à jour vos paramètres de notification.',
        de: 'Diese E-Mail wurde von AuctLect gesendet. Wenn Sie diese E-Mails nicht mehr erhalten möchten, aktualisieren Sie bitte Ihre Benachrichtigungseinstellungen.',
        ko: '이 이메일은 AuctLect에서 발송되었습니다. 더 이상 이러한 이메일을 받고 싶지 않으시면 알림 설정을 업데이트해 주세요.',
        ar: 'تم إرسال هذا البريد الإلكتروني بواسطة AuctLect. إذا كنت لا ترغب في تلقي هذه الرسائل الإلكترونية، يرجى تحديث إعدادات الإشعارات.',
        pt: 'Este email foi enviado pelo AuctLect. Se você não deseja mais receber esses emails, atualize suas configurações de notificação.'
    };

    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #8B7355 0%, #6B5344 100%); color: #fff; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .content h2 { color: #8B7355; margin-top: 0; }
        .content ul { padding-left: 20px; }
        .content li { margin-bottom: 8px; }
        .button { display: inline-block; background: #8B7355; color: #fff !important; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin-top: 20px; }
        .button:hover { background: #6B5344; }
        .footer { background: #f8f8f8; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .footer a { color: #8B7355; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 AuctLect</h1>
        </div>
        <div class="content">
            ${content}
            <p style="text-align: center;">
                <a href="${config.siteUrl}/pages/notifications.html" class="button">View Notifications</a>
            </p>
        </div>
        <div class="footer">
            <p>${footerText[lang] || footerText.en}</p>
            <p><a href="${config.siteUrl}/pages/account-settings.html">Notification Settings</a></p>
        </div>
    </div>
</body>
</html>
    `;
}

// ========== パラメータ置換 ==========
function replaceParams(text, params) {
    let result = text;
    Object.keys(params).forEach(key => {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
    });
    return result;
}

// ========== メール送信関数 ==========

/**
 * 通知メールを送信
 * @param {string} to - 送信先メールアドレス
 * @param {string} type - 通知タイプ (sale, translation_complete, feedback, comment, welcome)
 * @param {object} params - テンプレートパラメータ
 * @param {string} lang - 言語コード (en, ja, zh, es, fr, de, ko, ar, pt)
 */
async function sendNotificationEmail(to, type, params = {}, lang = 'en') {
    try {
        const template = emailTemplates[type];
        if (!template) {
            throw new Error(`Unknown notification type: ${type}`);
        }

        const subject = replaceParams(template.subject[lang] || template.subject.en, params);
        const bodyContent = replaceParams(template.body[lang] || template.body.en, params);
        const html = wrapInEmailTemplate(bodyContent, lang);

        const mailOptions = {
            from: `"${config.from.name}" <${config.from.address}>`,
            to: to,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId} to ${to} (type: ${type})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * 作品購入通知メールを送信
 */
async function sendSaleNotification(to, workTitle, amount, lang = 'en') {
    return sendNotificationEmail(to, 'sale', { work: workTitle, amount: amount }, lang);
}

/**
 * 翻訳完了通知メールを送信
 */
async function sendTranslationCompleteNotification(to, workTitle, language, lang = 'en') {
    return sendNotificationEmail(to, 'translation_complete', { work: workTitle, language: language }, lang);
}

/**
 * フィードバック通知メールを送信
 */
async function sendFeedbackNotification(to, workTitle, rating, lang = 'en') {
    return sendNotificationEmail(to, 'feedback', { work: workTitle, rating: rating }, lang);
}

/**
 * コメント通知メールを送信
 */
async function sendCommentNotification(to, workTitle, lang = 'en') {
    return sendNotificationEmail(to, 'comment', { work: workTitle }, lang);
}

/**
 * ウェルカムメールを送信
 */
async function sendWelcomeEmail(to, userName, lang = 'en') {
    return sendNotificationEmail(to, 'welcome', { name: userName }, lang);
}

// ========== エクスポート ==========
module.exports = {
    sendNotificationEmail,
    sendSaleNotification,
    sendTranslationCompleteNotification,
    sendFeedbackNotification,
    sendCommentNotification,
    sendWelcomeEmail,
    // テスト用
    transporter,
    config
};
