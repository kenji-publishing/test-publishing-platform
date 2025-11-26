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
      from: process.env.EMAIL_FROM || '"Publisher Platform" <noreply@publisher.com>',
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
 * Email Templates
 */
const templates = {
  // Welcome email for new users
  welcome: (userName) => ({
    subject: 'Welcome to Publisher! 🎉',
    text: `
Hi ${userName},

Welcome to Publisher - the multilingual publishing platform!

You can now:
✅ Upload your works
✅ Translate to 8 languages with AI
✅ Reach readers worldwide
✅ Earn revenue from your content

Get started: http://localhost:8000

Best regards,
The Publisher Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #4a90d9;">Welcome to Publisher! 🎉</h1>
  <p>Hi ${userName},</p>
  <p>Welcome to Publisher - the multilingual publishing platform!</p>
  <p>You can now:</p>
  <ul>
    <li>✅ Upload your works</li>
    <li>✅ Translate to 8 languages with AI</li>
    <li>✅ Reach readers worldwide</li>
    <li>✅ Earn revenue from your content</li>
  </ul>
  <p><a href="http://localhost:8000" style="background: #4a90d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
  <p>Best regards,<br>The Publisher Team</p>
</div>
    `
  }),

  // Translation complete notification
  translationComplete: (userName, workTitle, language) => ({
    subject: `Translation Complete: ${workTitle} → ${language} ✅`,
    text: `
Hi ${userName},

Great news! Your work has been translated.

📖 Work: ${workTitle}
🌍 Language: ${language}
✅ Status: Complete

View your translation: http://localhost:8000/pages/translation-status.html

Best regards,
The Publisher Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #28a745;">Translation Complete! ✅</h1>
  <p>Hi ${userName},</p>
  <p>Great news! Your work has been translated.</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p><strong>📖 Work:</strong> ${workTitle}</p>
    <p><strong>🌍 Language:</strong> ${language}</p>
    <p><strong>✅ Status:</strong> Complete</p>
  </div>
  <p><a href="http://localhost:8000/pages/translation-status.html" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Translation</a></p>
  <p>Best regards,<br>The Publisher Team</p>
</div>
    `
  }),

  // Purchase notification for author
  purchaseNotification: (authorName, workTitle, buyerName, amount) => ({
    subject: `New Sale: ${workTitle} 💰`,
    text: `
Hi ${authorName},

Congratulations! Someone purchased your work.

📖 Work: ${workTitle}
👤 Buyer: ${buyerName}
💰 Amount: $${amount}
📊 Your earnings: $${(amount * 0.4).toFixed(2)} (40%)

View your earnings: http://localhost:8000/pages/dashboard.html

Best regards,
The Publisher Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #ffc107;">New Sale! 💰</h1>
  <p>Hi ${authorName},</p>
  <p>Congratulations! Someone purchased your work.</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p><strong>📖 Work:</strong> ${workTitle}</p>
    <p><strong>👤 Buyer:</strong> ${buyerName}</p>
    <p><strong>💰 Amount:</strong> $${amount}</p>
    <p><strong>📊 Your earnings:</strong> $${(amount * 0.4).toFixed(2)} (40%)</p>
  </div>
  <p><a href="http://localhost:8000/pages/dashboard.html" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Earnings</a></p>
  <p>Best regards,<br>The Publisher Team</p>
</div>
    `
  }),

  // Monthly earnings report
  monthlyReport: (userName, totalEarnings, totalSales, topWork) => ({
    subject: `Your Monthly Earnings Report 📊`,
    text: `
Hi ${userName},

Here's your earnings report for this month.

💰 Total Earnings: $${totalEarnings}
📈 Total Sales: ${totalSales}
🏆 Top Work: ${topWork}

View details: http://localhost:8000/pages/dashboard.html

Best regards,
The Publisher Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #4a90d9;">Monthly Earnings Report 📊</h1>
  <p>Hi ${userName},</p>
  <p>Here's your earnings report for this month.</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <p><strong>💰 Total Earnings:</strong> $${totalEarnings}</p>
    <p><strong>📈 Total Sales:</strong> ${totalSales}</p>
    <p><strong>🏆 Top Work:</strong> ${topWork}</p>
  </div>
  <p><a href="http://localhost:8000/pages/dashboard.html" style="background: #4a90d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Details</a></p>
  <p>Best regards,<br>The Publisher Team</p>
</div>
    `
  })
};

module.exports = {
  sendEmail,
  templates
};