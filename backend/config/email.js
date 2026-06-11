/**
 * Email Configuration
 * Handles email sending for notifications
 */

const nodemailer = require('nodemailer');

// Create transporter based on environment
let transporter;

if (process.env.NODE_ENV === 'production' && process.env.EMAIL_HOST) {
  // Production: Use real email service
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
} else {
  // Development: Use test mode (logs to console)
  transporter = {
    sendMail: async (mailOptions) => {
      console.log('\n📧 ══════════════════════════════════════════');
      console.log('📧 EMAIL NOTIFICATION (Test Mode)');
      console.log('📧 ══════════════════════════════════════════');
      console.log('📧 To:', mailOptions.to);
      console.log('📧 Subject:', mailOptions.subject);
      console.log('📧 ──────────────────────────────────────────');
      console.log(mailOptions.text || mailOptions.html);
      console.log('📧 ══════════════════════════════════════════\n');
      return { messageId: 'test-' + Date.now() };
    }
  };
  console.log('📧 Email running in TEST MODE (emails logged to console)');
}

/**
 * Send email
 */
async function sendEmail(to, subject, text, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AuctLect Platform" <noreply@publisher.com>',
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Base URL for links
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

/**
 * Common email header HTML
 */
const emailHeader = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%); padding: 20px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📚 AuctLect</h1>
  </div>
  <div style="padding: 30px;">
`;

/**
 * Common email footer HTML
 */
const emailFooter = `
  </div>
  <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #6c757d;">
    <p style="margin: 0 0 10px 0;">このメールはAuctLectから自動送信されています。</p>
    <p style="margin: 0;">
      <a href="${BASE_URL}" style="color: #4a90d9; text-decoration: none;">AuctLect</a> |
      <a href="${BASE_URL}/pages/support/faq.html" style="color: #4a90d9; text-decoration: none;">FAQ</a> |
      <a href="${BASE_URL}/pages/account-settings.html" style="color: #4a90d9; text-decoration: none;">設定</a>
    </p>
    <p style="margin: 10px 0 0 0;">© 2026 AuctLect. All rights reserved.</p>
  </div>
</div>
`;

/**
 * Email Templates
 */
const templates = {
  // =============================================
  // User Account Templates
  // =============================================

  // Welcome email for new users
  welcome: (userName) => ({
    subject: 'Welcome to AuctLect! 🎉',
    text: `
Hi ${userName},

Welcome to AuctLect - the multilingual publishing platform!

You can now:
✅ Upload your works
✅ Translate to 8 languages with AI
✅ Reach readers worldwide
✅ Earn revenue from your content

Get started: ${BASE_URL}

Best regards,
The AuctLect Team
    `,
    html: `
${emailHeader}
  <h2 style="color: #333; margin-top: 0;">Welcome to AuctLect! 🎉</h2>
  <p>Hi ${userName},</p>
  <p>Welcome to AuctLect - the multilingual publishing platform!</p>
  <p>You can now:</p>
  <ul style="color: #555;">
    <li>✅ Upload your works</li>
    <li>✅ Translate to 8 languages with AI</li>
    <li>✅ Reach readers worldwide</li>
    <li>✅ Earn revenue from your content</li>
  </ul>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}" style="background: #4a90d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Get Started</a>
  </p>
  <p>Best regards,<br>The AuctLect Team</p>
${emailFooter}
    `
  }),

  // Translation complete notification
  translationComplete: (userName, workTitle, language) => ({
    subject: `翻訳完了: ${workTitle} → ${language} ✅`,
    text: `
${userName} 様

翻訳が完了しました。

📖 作品: ${workTitle}
🌍 言語: ${language}
✅ ステータス: 完了

翻訳を確認: ${BASE_URL}/pages/translation-status.html

AuctLect Team
    `,
    html: `
${emailHeader}
  <h2 style="color: #28a745; margin-top: 0;">翻訳完了 ✅</h2>
  <p>${userName} 様</p>
  <p>翻訳が完了しました。</p>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
    <p style="margin: 5px 0;"><strong>📖 作品:</strong> ${workTitle}</p>
    <p style="margin: 5px 0;"><strong>🌍 言語:</strong> ${language}</p>
    <p style="margin: 5px 0;"><strong>✅ ステータス:</strong> 完了</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/translation-status.html" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">翻訳を確認</a>
  </p>
${emailFooter}
    `
  }),

  // Purchase notification for author
  purchaseNotification: (authorName, workTitle, buyerName, amount) => ({
    subject: `売上通知: ${workTitle} 💰`,
    text: `
${authorName} 様

おめでとうございます！作品が購入されました。

📖 作品: ${workTitle}
👤 購入者: ${buyerName}
💰 金額: ¥${amount}
📊 収益: ¥${Math.floor(amount * 0.4)} (40%)

収益を確認: ${BASE_URL}/pages/dashboard.html

AuctLect Team
    `,
    html: `
${emailHeader}
  <h2 style="color: #ffc107; margin-top: 0;">売上通知 💰</h2>
  <p>${authorName} 様</p>
  <p>おめでとうございます！作品が購入されました。</p>
  <div style="background: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <p style="margin: 5px 0;"><strong>📖 作品:</strong> ${workTitle}</p>
    <p style="margin: 5px 0;"><strong>👤 購入者:</strong> ${buyerName}</p>
    <p style="margin: 5px 0;"><strong>💰 金額:</strong> ¥${amount}</p>
    <p style="margin: 5px 0;"><strong>📊 収益:</strong> ¥${Math.floor(amount * 0.4)} (40%)</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/dashboard.html" style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">収益を確認</a>
  </p>
${emailFooter}
    `
  }),

  // Monthly earnings report
  monthlyReport: (userName, totalEarnings, totalSales, topWork) => ({
    subject: `月次収益レポート 📊`,
    text: `
${userName} 様

今月の収益レポートです。

💰 総収益: ¥${totalEarnings}
📈 販売数: ${totalSales}
🏆 トップ作品: ${topWork}

詳細を確認: ${BASE_URL}/pages/dashboard.html

AuctLect Team
    `,
    html: `
${emailHeader}
  <h2 style="color: #4a90d9; margin-top: 0;">月次収益レポート 📊</h2>
  <p>${userName} 様</p>
  <p>今月の収益レポートです。</p>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>💰 総収益:</strong> ¥${totalEarnings}</p>
    <p style="margin: 5px 0;"><strong>📈 販売数:</strong> ${totalSales}</p>
    <p style="margin: 5px 0;"><strong>🏆 トップ作品:</strong> ${topWork}</p>
  </div>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/dashboard.html" style="background: #4a90d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">詳細を確認</a>
  </p>
${emailFooter}
    `
  }),

  // =============================================
  // Support Ticket Templates (Phase E)
  // =============================================

  // Ticket received confirmation
  ticketReceived: (userName, ticketNumber, subject, category) => ({
    subject: `【受付完了】お問い合わせを受け付けました (${ticketNumber})`,
    text: `
${userName || 'お客'} 様

お問い合わせありがとうございます。
以下の内容で受け付けました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 チケット番号: ${ticketNumber}
📁 カテゴリ: ${category}
📝 件名: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

サポートチームより順次対応いたします。
回答まで数営業日いただく場合がございます。

チケットの状況確認: ${BASE_URL}/pages/support/tickets.html

※ このメールに直接返信いただいても対応できません。
  追加のご質問はチケット画面からお願いします。

AuctLect サポートチーム
    `,
    html: `
${emailHeader}
  <h2 style="color: #4a90d9; margin-top: 0;">お問い合わせを受け付けました ✅</h2>
  <p>${userName || 'お客'} 様</p>
  <p>お問い合わせありがとうございます。<br>以下の内容で受け付けました。</p>
  
  <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a90d9;">
    <p style="margin: 8px 0;"><strong>📋 チケット番号:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px;">${ticketNumber}</code></p>
    <p style="margin: 8px 0;"><strong>📁 カテゴリ:</strong> ${category}</p>
    <p style="margin: 8px 0;"><strong>📝 件名:</strong> ${subject}</p>
  </div>
  
  <p>サポートチームより順次対応いたします。<br>回答まで数営業日いただく場合がございます。</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/support/tickets.html" style="background: #4a90d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">チケットを確認</a>
  </p>
  
  <p style="font-size: 13px; color: #6c757d; background: #f8f9fa; padding: 15px; border-radius: 5px;">
    ⚠️ このメールに直接返信いただいても対応できません。<br>
    追加のご質問はチケット画面からお願いします。
  </p>
${emailFooter}
    `
  }),

  // Ticket received with related FAQs
  ticketReceivedWithFaq: (userName, ticketNumber, subject, category, faqs) => {
    const faqListText = faqs.map((faq, i) => `  ${i + 1}. ${faq.question_ja}\n     → ${BASE_URL}/pages/support/faq.html#faq-${faq.id}`).join('\n');
    const faqListHtml = faqs.map(faq => `
      <li style="margin: 10px 0;">
        <a href="${BASE_URL}/pages/support/faq.html#faq-${faq.id}" style="color: #4a90d9; text-decoration: none;">${faq.question_ja}</a>
      </li>
    `).join('');

    return {
      subject: `【受付完了】お問い合わせを受け付けました (${ticketNumber})`,
      text: `
${userName || 'お客'} 様

お問い合わせありがとうございます。
以下の内容で受け付けました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 チケット番号: ${ticketNumber}
📁 カテゴリ: ${category}
📝 件名: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【関連するFAQ】
お問い合わせ内容に関連する可能性のあるFAQです。
解決のヒントになるかもしれません。

${faqListText}

サポートチームより順次対応いたします。
回答まで数営業日いただく場合がございます。

チケットの状況確認: ${BASE_URL}/pages/support/tickets.html

AuctLect サポートチーム
      `,
      html: `
${emailHeader}
  <h2 style="color: #4a90d9; margin-top: 0;">お問い合わせを受け付けました ✅</h2>
  <p>${userName || 'お客'} 様</p>
  <p>お問い合わせありがとうございます。<br>以下の内容で受け付けました。</p>
  
  <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4a90d9;">
    <p style="margin: 8px 0;"><strong>📋 チケット番号:</strong> <code style="background: #fff; padding: 2px 8px; border-radius: 4px;">${ticketNumber}</code></p>
    <p style="margin: 8px 0;"><strong>📁 カテゴリ:</strong> ${category}</p>
    <p style="margin: 8px 0;"><strong>📝 件名:</strong> ${subject}</p>
  </div>
  
  <div style="background: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <h3 style="color: #856404; margin-top: 0; font-size: 16px;">💡 関連するFAQ</h3>
    <p style="color: #856404; font-size: 14px;">お問い合わせ内容に関連する可能性のあるFAQです。解決のヒントになるかもしれません。</p>
    <ul style="margin: 0; padding-left: 20px;">
      ${faqListHtml}
    </ul>
  </div>
  
  <p>サポートチームより順次対応いたします。<br>回答まで数営業日いただく場合がございます。</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/support/tickets.html" style="background: #4a90d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">チケットを確認</a>
  </p>
${emailFooter}
      `
    };
  },

  // Admin reply notification
  ticketReply: (userName, ticketNumber, subject, replyPreview) => ({
    subject: `【返信あり】${subject} (${ticketNumber})`,
    text: `
${userName || 'お客'} 様

お問い合わせに返信がありました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 チケット番号: ${ticketNumber}
📝 件名: ${subject}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【返信内容（プレビュー）】
${replyPreview}...

全文を確認するには下記リンクからチケットを開いてください。

チケットを確認: ${BASE_URL}/pages/support/tickets.html

AuctLect サポートチーム
    `,
    html: `
${emailHeader}
  <h2 style="color: #28a745; margin-top: 0;">返信がありました 💬</h2>
  <p>${userName || 'お客'} 様</p>
  <p>お問い合わせに返信がありました。</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 5px 0;"><strong>📋 チケット番号:</strong> ${ticketNumber}</p>
    <p style="margin: 5px 0;"><strong>📝 件名:</strong> ${subject}</p>
  </div>
  
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
    <p style="margin: 0; color: #2e7d32;"><strong>返信内容（プレビュー）:</strong></p>
    <p style="margin: 10px 0 0 0; color: #555;">${replyPreview}...</p>
  </div>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/support/tickets.html" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">全文を確認</a>
  </p>
${emailFooter}
    `
  }),

  // Ticket resolved - satisfaction survey
  ticketResolved: (userName, ticketNumber, subject) => ({
    subject: `【解決済み】${subject} (${ticketNumber})`,
    text: `
${userName || 'お客'} 様

お問い合わせが「解決済み」になりました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 チケット番号: ${ticketNumber}
📝 件名: ${subject}
✅ ステータス: 解決済み
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ご満足いただけましたでしょうか？
今後のサービス向上のため、ぜひ評価をお願いいたします。

評価する: ${BASE_URL}/pages/support/tickets.html

ご利用ありがとうございました。

AuctLect サポートチーム
    `,
    html: `
${emailHeader}
  <h2 style="color: #28a745; margin-top: 0;">解決済みになりました ✅</h2>
  <p>${userName || 'お客'} 様</p>
  <p>お問い合わせが「解決済み」になりました。</p>
  
  <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
    <p style="margin: 5px 0;"><strong>📋 チケット番号:</strong> ${ticketNumber}</p>
    <p style="margin: 5px 0;"><strong>📝 件名:</strong> ${subject}</p>
    <p style="margin: 5px 0;"><strong>✅ ステータス:</strong> 解決済み</p>
  </div>
  
  <div style="background: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>ご満足いただけましたか？</strong></p>
    <p style="margin: 0 0 15px 0; color: #666;">今後のサービス向上のため、ぜひ評価をお願いいたします。</p>
    <div style="font-size: 24px;">
      ⭐ ⭐ ⭐ ⭐ ⭐
    </div>
  </div>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/support/tickets.html" style="background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">評価する</a>
  </p>
  
  <p>ご利用ありがとうございました。</p>
${emailFooter}
    `
  }),

  // Ticket closed
  ticketClosed: (userName, ticketNumber, subject) => ({
    subject: `【クローズ】${subject} (${ticketNumber})`,
    text: `
${userName || 'お客'} 様

チケットがクローズされました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 チケット番号: ${ticketNumber}
📝 件名: ${subject}
📌 ステータス: クローズ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

同じ問題が再度発生した場合は、新しいお問い合わせを作成してください。

お問い合わせ: ${BASE_URL}/pages/support/troubleshoot.html

ご利用ありがとうございました。

AuctLect サポートチーム
    `,
    html: `
${emailHeader}
  <h2 style="color: #6c757d; margin-top: 0;">チケットがクローズされました 📌</h2>
  <p>${userName || 'お客'} 様</p>
  <p>チケットがクローズされました。</p>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
    <p style="margin: 5px 0;"><strong>📋 チケット番号:</strong> ${ticketNumber}</p>
    <p style="margin: 5px 0;"><strong>📝 件名:</strong> ${subject}</p>
    <p style="margin: 5px 0;"><strong>📌 ステータス:</strong> クローズ</p>
  </div>
  
  <p>同じ問題が再度発生した場合は、新しいお問い合わせを作成してください。</p>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/support/troubleshoot.html" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">新しいお問い合わせ</a>
  </p>
  
  <p>ご利用ありがとうございました。</p>
${emailFooter}
    `
  }),

  // User reply notification (for admin)
  ticketUserReply: (userName, ticketNumber, subject, userEmail) => ({
    subject: `【ユーザー返信】${subject} (${ticketNumber})`,
    text: `
サポートチームへ

ユーザーからチケットに返信がありました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 チケット番号: ${ticketNumber}
📝 件名: ${subject}
👤 ユーザー: ${userName || 'ゲスト'} <${userEmail}>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

管理画面から確認してください。

AuctLect System
    `,
    html: `
${emailHeader}
  <h2 style="color: #dc3545; margin-top: 0;">ユーザーから返信がありました 🔔</h2>
  <p>サポートチームへ</p>
  <p>ユーザーからチケットに返信がありました。</p>
  
  <div style="background: #fff5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
    <p style="margin: 5px 0;"><strong>📋 チケット番号:</strong> ${ticketNumber}</p>
    <p style="margin: 5px 0;"><strong>📝 件名:</strong> ${subject}</p>
    <p style="margin: 5px 0;"><strong>👤 ユーザー:</strong> ${userName || 'ゲスト'} &lt;${userEmail}&gt;</p>
  </div>
  
  <p style="text-align: center; margin: 30px 0;">
    <a href="${BASE_URL}/pages/admin/support.html" style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">管理画面で確認</a>
  </p>
${emailFooter}
    `
  })
};

/**
 * Category labels mapping
 */
const categoryLabels = {
  'account': 'アカウント関連',
  'payment': '決済・支払い',
  'translation': '翻訳サービス',
  'works': '作品管理',
  'technical': '技術的な問題',
  'other': 'その他'
};

/**
 * Get category label
 */
function getCategoryLabel(category) {
  return categoryLabels[category] || category;
}

module.exports = {
  sendEmail,
  templates,
  getCategoryLabel,
  BASE_URL
};
