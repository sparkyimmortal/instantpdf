import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL = process.env.SMTP_FROM || "InstantPDF <noreply@instantpdf.in>";
const NOTIFY_EMAIL = process.env.SMTP_NOTIFY_TO || "support@instantpdf.in";

export async function sendWelcomeEmail(to: string): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log("Email service not configured, skipping welcome email");
    return false;
  }

  try {
    await mailer.sendMail({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to InstantPDF!",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">InstantPDF</h1>
          </div>
          <h2 style="color: #fff; font-size: 22px; margin-bottom: 16px;">Welcome aboard!</h2>
          <p style="color: #94a3b8; line-height: 1.6;">Thank you for creating your InstantPDF account. You now have access to 30+ PDF tools with enhanced daily limits.</p>
          <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <h3 style="color: #06b6d4; margin-bottom: 12px;">Your Free Plan Includes:</h3>
            <ul style="color: #94a3b8; padding-left: 20px; line-height: 2;">
              <li>15 operations per day</li>
              <li>10MB max file size</li>
              <li>40 pages max per document</li>
              <li>All PDF tools included</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://instantpdf.in" style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #06b6d4, #3b82f6); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Start Using PDF Tools</a>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">InstantPDF - All your PDF tools in one place</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log("Email service not configured, skipping password reset email");
    return false;
  }

  const resetLink = `https://instantpdf.in/reset-password?token=${resetToken}`;

  try {
    await mailer.sendMail({
      from: FROM_EMAIL,
      to,
      subject: "Reset Your InstantPDF Password",
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">InstantPDF</h1>
          </div>
          <h2 style="color: #fff; font-size: 22px; margin-bottom: 16px;">Password Reset Request</h2>
          <p style="color: #94a3b8; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #06b6d4, #3b82f6); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; line-height: 1.6;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">InstantPDF - All your PDF tools in one place</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

export async function sendContactNotification(name: string, email: string, subject: string, message: string, source: string = "web", category: string = "general"): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log("Email service not configured, skipping contact notification");
    return false;
  }

  const categoryLabels: Record<string, string> = {
    general: "General",
    billing: "Billing",
    bug: "Bug Report",
    feature: "Feature Request",
  };

  try {
    await mailer.sendMail({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `[Contact] [${categoryLabels[category] || category}] ${subject}`,
      replyTo: email,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <h2 style="color: #06b6d4; margin-bottom: 16px;">New Contact Submission</h2>
          <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <p style="color: #94a3b8;"><strong style="color: #fff;">From:</strong> ${name} (${email})</p>
            <p style="color: #94a3b8;"><strong style="color: #fff;">Subject:</strong> ${subject}</p>
            <p style="color: #94a3b8;"><strong style="color: #fff;">Source:</strong> ${source === "mobile" ? "Mobile App" : "Website"}</p>
            <p style="color: #94a3b8;"><strong style="color: #fff;">Category:</strong> ${categoryLabels[category] || category}</p>
          </div>
          <div style="background: #1e293b; border-radius: 12px; padding: 20px;">
            <p style="color: #94a3b8;"><strong style="color: #fff;">Message:</strong></p>
            <p style="color: #e2e8f0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Reply directly to this email to respond to the user.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send contact notification:", error);
    return false;
  }
}

export async function sendAdminReplyEmail(to: string, originalSubject: string, replyMessage: string): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log("Email service not configured, skipping admin reply email");
    return false;
  }

  try {
    await mailer.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Re: ${originalSubject || "Your message to InstantPDF"}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">InstantPDF</h1>
          </div>
          <h2 style="color: #fff; font-size: 20px; margin-bottom: 16px;">Reply from InstantPDF Support</h2>
          <div style="background: #1e293b; border-radius: 12px; padding: 20px;">
            <p style="color: #e2e8f0; line-height: 1.8; white-space: pre-wrap;">${replyMessage}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 32px;">InstantPDF - All your PDF tools in one place</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send admin reply email:", error);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}
