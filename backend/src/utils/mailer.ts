import nodemailer from 'nodemailer';

// Create a transporter. For testing, it will fallback to logging if SMTP settings are missing
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (input: SendMailInput): Promise<boolean> => {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: `"Shree Sawariya Seth Gaushala" <${smtpUser}>`,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      console.log(`[EMAIL] Email sent successfully to ${input.to}`);
      return true;
    } else {
      console.log('\n=================== MOCK EMAIL SENT ===================');
      console.log(`To:      ${input.to}`);
      console.log(`Subject: ${input.subject}`);
      console.log(`Text:    ${input.text}`);
      console.log('=======================================================\n');
      return true;
    }
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
};

/**
 * Sends a password reset email to the user
 */
export const sendResetPasswordEmail = async (email: string, resetToken: string): Promise<boolean> => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #be490e; text-align: center;">Shree Sawariya Seth Gaushala</h2>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello,</p>
      <p>We received a request to reset your password for your Gaushala Management System account.</p>
      <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #be490e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #64748b;">${resetLink}</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px; margin-bottom: 10px;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Shree Sawariya Seth Gaushala Trust. Chittorgarh, Rajasthan.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - Shree Sawariya Seth Gaushala',
    text: `Reset your password by visiting this link: ${resetLink}`,
    html,
  });
};
