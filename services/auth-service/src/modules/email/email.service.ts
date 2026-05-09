import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import path from 'node:path';
import fs from 'node:fs';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    if (env.NODE_ENV !== 'test') {
      this.transporter.verify((error) => {
        if (error) {
          logger.error(`SMTP Connection Error: ${error}`);
        } else {
          logger.info('SMTP Server is ready to take our messages');
        }
      });
    }
  }

  /**
   * Read HTML template file and replace placeholders
   * @param templateName - Name of the template file (without .html extension)
   * @param variables - Key-value pairs to replace in the template (e.g., { username: 'John' })
   * @returns The processed HTML string with variables replaced
   */
  private getTemplate(templateName: string, variables: Record<string, string>): string {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    let html = fs.readFileSync(templatePath, 'utf8');

    // replace placeholders in the format {{key}} with corresponding values
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value);
    }

    return html;
  }

  /**
   * Send OTP verify email
   * @param to - Recipient email address
   * @param otp - One-time password to include in the email
   * @param username - Recipient's name to personalize the email
   * @returns A promise that resolves when the email is sent successfully, or rejects with an error
   */
  async sendEmailVerificationOTP(
    to: string,
    otp: string,
    userName: string = 'Student',
  ): Promise<void> {
    const html = this.getTemplate('otpTemplate', { otp, userName });

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Your OTP Code for Cambridge Platform',
      html,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to ${to}`);
  }

  /**
   * Send OTP reset password email
   * @param to - Recipient email address
   * @param otp - One-time password to include in the email
   * @param username - Recipient's name to personalize the email
   * @returns A promise that resolves when the email is sent successfully, or rejects with an error
   */
  async sendPasswordResetEmail(
    to: string,
    otp: string,
    userName: string = 'Student',
  ): Promise<void> {
    const html = this.getTemplate('passwordResetTemplate', { otp, userName });

    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject: 'Cambridge Platform - Password Reset Request',
      html,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${to}`);
  }
}

export const emailService = new EmailService();
