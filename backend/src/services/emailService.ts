import nodemailer from 'nodemailer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });
    
    // Verify connection configuration
    this.verifyConnection();
  }
  
  private async verifyConnection(): Promise<void> {
    try {
      if (config.email.smtp.host && config.email.smtp.user) {
        await this.transporter.verify();
        logger.info('Email service connected successfully');
      } else {
        logger.warn('Email service not configured - emails will be logged only');
      }
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }
  
  private async sendEmail({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      if (!config.email.smtp.host || !config.email.smtp.user) {
        // Log email instead of sending in development/test
        logger.info('Email would be sent:', {
          to,
          subject,
          html,
          text,
        });
        return;
      }
      
      const mailOptions = {
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to,
        subject,
      });
      
    } catch (error) {
      logger.error('Failed to send email:', {
        error,
        to,
        subject,
      });
      throw error;
    }
  }
  
  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  // Email templates
  public async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.cors.origin[0]}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - LedgerLink</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LedgerLink!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up for LedgerLink. To complete your account setup, please verify your email address by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If you can't click the button, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
            <p>This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with LedgerLink, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 LedgerLink. All rights reserved.</p>
            <p>Questions? Contact us at support@ledgerlink.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - LedgerLink',
      html,
    });
  }
  
  public async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.cors.origin[0]}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - LedgerLink</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .warning { background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset the password for your LedgerLink account. If you made this request, click the button below to set a new password:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If you can't click the button, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
            <div class="warning">
              <p><strong>Security Notice:</strong></p>
              <ul>
                <li>This link will expire in 10 minutes</li>
                <li>If you didn't request this reset, you can safely ignore this email</li>
                <li>Your password will remain unchanged unless you click the link and set a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 LedgerLink. All rights reserved.</p>
            <p>Questions? Contact us at support@ledgerlink.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - LedgerLink',
      html,
    });
  }
  
  public async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to LedgerLink!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .feature { background-color: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LedgerLink, ${firstName}!</h1>
          </div>
          <div class="content">
            <h2>Your Account is Ready!</h2>
            <p>Congratulations! Your LedgerLink account has been successfully verified and is ready to use.</p>
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
              <h4>🔗 Connect Your ERP Systems</h4>
              <p>Link your Xero, QuickBooks, Sage, or NetSuite accounts for automatic data sync.</p>
            </div>
            
            <div class="feature">
              <h4>📊 Upload CSV Files</h4>
              <p>Import invoice data directly from CSV files for instant matching.</p>
            </div>
            
            <div class="feature">
              <h4>🤖 AI-Powered Matching</h4>
              <p>Let our AI automatically match invoices with high accuracy.</p>
            </div>
            
            <div class="feature">
              <h4>📈 Generate Reports</h4>
              <p>Create detailed reconciliation reports for compliance and analysis.</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${config.cors.origin[0]}/dashboard" class="button">Get Started</a>
            </p>
            
            <p>Need help getting started? Check out our <a href="${config.cors.origin[0]}/docs">documentation</a> or contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 LedgerLink. All rights reserved.</p>
            <p>Questions? Contact us at support@ledgerlink.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.sendEmail({
      to: email,
      subject: 'Welcome to LedgerLink - Get Started!',
      html,
    });
  }
  
  public async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LedgerLink Notification</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${message}</p>
            ${actionUrl && actionText ? `
              <p style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" class="button">${actionText}</a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>© 2024 LedgerLink. All rights reserved.</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.sendEmail({
      to: email,
      subject: `LedgerLink: ${subject}`,
      html,
    });
  }
}

export const emailService = new EmailService();