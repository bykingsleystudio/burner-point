import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface SMSOptions {
  to: string;
  body: string;
  from?: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Initialize Resend SMTP transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT', '465')),
      secure: true, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  // ─── Email Services ───────────────────────────────────────────────────────

  async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    try {
      const mailOptions = {
        from: options.from || this.configService.get('SMTP_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${result.messageId} to ${options.to}`);
      return { messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to Burner Point, ${firstName}!</h1>
        <p>Thank you for joining Burner Point. Your account has been successfully created.</p>
        <p>You can now:</p>
        <ul>
          <li>Purchase verification credits</li>
          <li>Rent burner phone numbers</li>
          <li>Subscribe to premium services</li>
        </ul>
        <p>Get started by logging into your dashboard.</p>
        <a href="${this.configService.get('WEB_URL')}/dashboard"
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Go to Dashboard
        </a>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Burner Point!',
      html,
    });
  }

  async sendPaymentConfirmation(email: string, amount: number, reference: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Payment Confirmed</h1>
        <p>Your payment of ₦${amount / 100} has been successfully processed.</p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p>Your credits have been added to your wallet.</p>
        <a href="${this.configService.get('WEB_URL')}/dashboard/wallet"
           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          View Wallet
        </a>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Payment Confirmation - Burner Point',
      html,
    });
  }

  async sendOTPEmail(email: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Your Verification Code</h1>
        <p>Use the following code to verify your email address:</p>
        <div style="font-size: 24px; font-weight: bold; background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Your Verification Code - Burner Point',
      html,
    });
  }

  // ─── SMS Services (via Twilio) ───────────────────────────────────────────

  async sendSMS(options: SMSOptions): Promise<{ sid: string }> {
    // This would integrate with the existing ProviderService
    // For now, we'll throw an error indicating this should be handled by phone-auth
    throw new Error('SMS sending should be handled through phone-auth module');
  }

  // ─── Bulk Operations ─────────────────────────────────────────────────────

  async sendBulkEmail(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        success++;
      } catch (error) {
        this.logger.error(`Failed to send bulk email to ${email.to}`, error);
        failed++;
      }
    }

    return { success, failed };
  }
}