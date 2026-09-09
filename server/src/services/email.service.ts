import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    if (config.smtpHost && config.smtpUser && config.smtpPass) {
      transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
    } else if (config.smtpUser && config.smtpPass) {
      // Direct Gmail service
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
    } else {
      // Fallback transport
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporter;
}

export class EmailService {
  /**
   * Send a branded OTP verification email
   */
  static async sendOtpEmail(params: {
    to: string;
    otp: string;
    purpose?: string;
    name?: string;
  }): Promise<{ success: boolean; messageId?: string }> {
    const { to, otp, purpose = 'registration', name = 'Student' } = params;
    const isRegistration = purpose === 'registration';
    const actionTitle = isRegistration ? 'Email Verification' : 'Password Reset';

    const mailOptions = {
      from: config.smtpFrom,
      to,
      subject: `[EduMentor AI] Your ${actionTitle} Code: ${otp}`,
      text: `Hello ${name},\n\nYour EduMentor AI verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nEduMentor AI Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 540px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
            .header { background: #2563eb; padding: 24px; text-align: center; color: #ffffff; }
            .content { padding: 32px 24px; text-align: center; }
            .otp-box { background: #eff6ff; border: 2px dashed #bfdbfe; border-radius: 12px; padding: 18px 24px; margin: 24px 0; display: inline-block; }
            .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin:0; font-size: 22px; font-weight: 700;">🎓 EduMentor AI</h1>
              <p style="margin:4px 0 0 0; font-size: 13px; opacity: 0.9;">Intelligent Personal Learning Platform</p>
            </div>
            <div class="content">
              <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">${actionTitle}</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                Hello <strong>${name}</strong>,<br>
                Use the following 6-digit verification code to complete your ${actionTitle.toLowerCase()} on EduMentor AI.
              </p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
                ⏱️ This code is valid for <strong>10 minutes</strong>.<br>
                If you did not initiate this request, please safely ignore this email.
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} EduMentor AI Platform. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const client = getTransporter();
      const info = await client.sendMail(mailOptions);
      logger.info(`Nodemailer sent OTP email to ${to} (${info.messageId || 'json-mock'})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error(`Nodemailer delivery error for ${to}: ${error.message || String(error)}`);
      return { success: false };
    }
  }
}

export const emailService = new EmailService();
