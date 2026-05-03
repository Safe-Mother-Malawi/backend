import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service to send password reset emails
 * In production, integrate with SendGrid, AWS SES, or similar
 */
@Injectable()
export class PasswordResetEmailService {
  private readonly appUrl: string;
  private readonly appName: string = 'Safe Mother Malawi';

  constructor(private readonly configService: ConfigService) {
    this.appUrl = this.configService.get('APP_URL', 'http://localhost:3000');
  }

  /**
   * Send password reset email with token link
   */
  async sendResetEmail(email: string, token: string, userName: string): Promise<void> {
    const resetLink = `${this.appUrl}/reset-password?token=${token}`;

    const emailContent = this.buildResetEmailHTML(userName, resetLink);

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] Sending password reset to ${email}`);
    console.log(`[EMAIL] Reset link: ${resetLink}`);
    console.log(`[EMAIL] Content:\n${emailContent}`);

    // For now, just log it
    // In production:
    // await this.emailService.send({
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: emailContent,
    // });
  }

  /**
   * Send password changed notification email
   */
  async sendPasswordChangedEmail(email: string, userName: string): Promise<void> {
    const emailContent = this.buildPasswordChangedEmailHTML(userName);

    // TODO: Integrate with email service
    console.log(`[EMAIL] Sending password changed notification to ${email}`);
    console.log(`[EMAIL] Content:\n${emailContent}`);

    // In production:
    // await this.emailService.send({
    //   to: email,
    //   subject: 'Your Password Has Been Changed',
    //   html: emailContent,
    // });
  }

  private buildResetEmailHTML(userName: string, resetLink: string): string {
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
            .button { display: inline-block; background-color: #0D47A1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; }
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
              
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetLink}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 3px;">
                ${resetLink}
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link expires in 1 hour</li>
                  <li>If you didn't request this, ignore this email</li>
                  <li>Never share this link with anyone</li>
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
