import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<void> {
  try {
    const isMock = !env.SMTP_HOST || env.SMTP_USER?.includes('your_email') || env.SMTP_PASS?.includes('your_smtp_password');

    if (isMock) {
      logger.info(`[SIMULATED EMAIL]
=========================================
TO:      ${to}
SUBJECT: ${subject}
TEXT:    ${text || 'No text content'}
HTML:    ${html || 'No HTML content'}
=========================================`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: env.EMAIL_FROM || '"TUTORLY" <noreply@tutorly.lk>',
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email successfully sent to: ${to}`);
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error);
  }
}
