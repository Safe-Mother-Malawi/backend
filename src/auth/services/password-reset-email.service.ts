import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Service to send password reset emails
 * Supports Mailtrap (development) and SendGrid/AWS SES (production)
 */
@Injectable()
export class PasswordResetEmailService {
  private readonly appUrl: string;
  private readonly appName: string = 'Safe Mother Malawi';
  private readonly logger = new Logger(PasswordResetEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.appUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  private initializeTransporter(): void {
    const emailHost = this.configService.get('EMAIL_HOST');
    const emailPort = this.configService.get('EMAIL_PORT');
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPassword = this.configService.get('EMAIL_PASSWORD');

    if (!emailHost || !emailUser || !emailPassword) {
      this.logger.warn(
        'Email configuration incomplete. Password reset emails will not be sent. ' +
        'Configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in .env',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort || '587'),
      secure: emailPort === '465', // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  /**
   * Send password reset email with token link
   */
  async sendResetEmail(email: string, token: string, userName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[EMAIL] Email not configured. Would send reset to ${email}`);
      return;
    }

    const resetLink = `${this.appUrl}/reset-password?token=${token}`;
    const emailContent = this.buildResetEmailHTML(userName, resetLink);
    const emailFrom = this.configService.get('EMAIL_FROM', 'noreply@safemothermalawi.org');
    const emailFromName = this.configService.get('EMAIL_FROM_NAME', 'Safe Mother Malawi');

    try {
      await this.transporter.sendMail({
        from: `${emailFromName} <${emailFrom}>`,
        to: email,
        subject: 'Password Reset Request - Safe Mother Malawi',
        html: emailContent,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      throw error;
    }
  }

  /**
   * Send password changed notification email
   */
  async sendPasswordChangedEmail(email: string, userName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[EMAIL] Email not configured. Would send notification to ${email}`);
      return;
    }

    const emailContent = this.buildPasswordChangedEmailHTML(userName);
    const emailFrom = this.configService.get('EMAIL_FROM', 'noreply@safemothermalawi.org');
    const emailFromName = this.configService.get('EMAIL_FROM_NAME', 'Safe Mother Malawi');

    try {
      await this.transporter.sendMail({
        from: `${emailFromName} <${emailFrom}>`,
        to: email,
        subject: 'Your Password Has Been Changed - Safe Mother Malawi',
        html: emailContent,
      });
      this.logger.log(`Password changed notification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password changed email to ${email}:`, error);
      throw error;
    }
  }

  private buildResetEmailHTML(userName: string, resetLink: string): string {
    // Extract token from reset link
    const tokenMatch = resetLink.match(/token=([a-f0-9]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0D47A1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .token-box { background-color: #E3F2FD; border: 2px solid #0D47A1; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; word-break: break-all; text-align: center; font-size: 14px; font-weight: bold; }
            .info { background-color: #E8F5E9; border: 1px solid #4CAF50; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            .step { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #0D47A1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
              <p>Password Reset Request</p>
            </div>
            
            <div class="content">
              <p>Hello ${userName},</p>
              
              <p>We received a request to reset your password. Use the token below to reset your password in the Safe Mother Malawi app:</p>
              
              <div class="token-box">
                ${token}
              </div>
              
              <div class="info">
                <strong>📱 How to reset your password:</strong>
                <div class="step">
                  <strong>Step 1:</strong> Open the Safe Mother Malawi app
                </div>
                <div class="step">
                  <strong>Step 2:</strong> Click "Forgot Password"
                </div>
                <div class="step">
                  <strong>Step 3:</strong> Enter your email address
                </div>
                <div class="step">
                  <strong>Step 4:</strong> Copy the token above and paste it in the app
                </div>
                <div class="step">
                  <strong>Step 5:</strong> Enter your new password and confirm
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This token expires in 1 hour</li>
                  <li>If you didn't request this, ignore this email</li>
                  <li>Never share this token with anyone</li>
                  <li>All your active sessions will be logged out after reset</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact our support team.</p>
              
              <p>Best regards,<br>${this.appName} Team</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private buildPasswordChangedEmailHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2E7D32; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.appName}</h1>
              <p>Password Changed Successfully</p>
            </div>
            
            <div class="content">
              <p>Hello ${userName},</p>
              
              <p>Your password has been successfully changed.</p>
              
              <div class="alert">
                <strong>⚠️ Important:</strong>
                <p>If you did not make this change, please contact our support team immediately at support@example.com</p>
              </div>
              
              <h3>What happened:</h3>
              <ul>
                <li>✓ Your password has been updated</li>
                <li>✓ All active sessions have been logged out</li>
                <li>✓ You will need to login again with your new password</li>
              </ul>
              
              <h3>Next steps:</h3>
              <ol>
                <li>Login with your new password</li>
                <li>Review your account security settings</li>
                <li>Enable two-factor authentication if available</li>
              </ol>
              
              <p>If you have any questions or concerns, please contact our support team.</p>
              
              <p>Best regards,<br>${this.appName} Team</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
              <p>This is an automated email. Please do not reply directly.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
