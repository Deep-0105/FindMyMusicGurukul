const nodemailer = require('nodemailer');

// Mock Mailer Transport using Ethereal or just logging to console
const sendEmail = async ({ to, subject, html }) => {
  try {
    // We are simulating the email sending process
    console.log('\n=================== NEW EMAIL NOTIFICATION ===================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--- Body ---');
    console.log(html.replace(/<[^>]*>?/gm, '')); // Strip HTML for console readability
    console.log('==============================================================\n');

    // Configure real SMTP here if credentials are provided in .env
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      
      // Basic email validation regex to prevent Nodemailer from throwing "No recipients defined" on dummy emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!to || !emailRegex.test(to)) {
        console.log(`[MAILER] Skipped sending real email. '${to}' is not a valid email address format.`);
        return { success: false, message: 'Invalid recipient email format' };
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      });
      
      await transporter.sendMail({
        from: '"FindMyMusicGurukul" <deepgavat@gmail.com>',
        to,
        subject,
        html
      });
    } else {
      console.log('[MAILER] Real email not sent: SMTP_USER and SMTP_PASS are missing from .env');
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};

module.exports = { sendEmail };
