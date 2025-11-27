import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Config } from '../config/config';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

export const createEmailService = (config: Config) => {
  // Set SendGrid API Key
  if (config.email.sendgridApiKey) {
    sgMail.setApiKey(config.email.sendgridApiKey);
  }

  /**
   * Sends an email using the configured email provider.
   * @param {string} to - The recipient's email address.
   * @param {string} subject - The subject of the email.
   * @param {string} html - The HTML content of the email.
   * @throws {ApiError} If the email provider is not configured or fails to send the email.
   */
  const sendEmail = async (to: string, subject: string, html: string) => {
    if (config.email.provider === 'NODEMAILER') {
      const transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure, // true for 465, false for other ports
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass,
        },
      });
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
    } else if (config.email.provider === 'SENDGRID') {
      const msg = {
        to,
        from: config.email.from,
        subject,
        html,
      };
      try {
        await sgMail.send(msg);
      } catch (error) {
        const errorStack = error instanceof Error ? error.stack : undefined;
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          'Failed to send email',
          true,
          errorStack,
        );
      }
    } else {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Invalid email provider configured');
    }
  };

  /**
   * Sends a password reset email to the user.
   * @param {string} to - The recipient's email address.
   * @param {string} token - The password reset token.
   * @param {string} clientUrl - The base URL of the client application.
   */
  const sendResetPasswordEmail = async (to: string, token: string, clientUrl: string) => {
    const subject = 'Reset your password';
    // In a real application, you would use a proper templating engine
    // For now, a simple string interpolation
    const resetPasswordUrl = `${clientUrl}/reset-password?token=${token}`;
    const html = `
      <p>Dear user,</p>
      <p>To reset your password, click on this link: <a href="${resetPasswordUrl}">Reset password</a></p>
      <p>If you did not request any password resets, then ignore this email.</p>
    `;
    await sendEmail(to, subject, html);
  };

  /**
   * Sends a welcome email to the new user.
   * @param {string} to - The recipient's email address.
   * @param {string} username - The user's username.
   */
  const sendWelcomeEmail = async (to: string, username: string) => {
    const subject = 'Welcome!';
    const html = `
      <p>Dear ${username},</p>
      <p>Welcome to our application!</p>
      <p>We are excited to have you on board.</p>
    `;
    await sendEmail(to, subject, html);
  };

  return {
    sendEmail,
    sendResetPasswordEmail,
    sendWelcomeEmail,
  };
};
