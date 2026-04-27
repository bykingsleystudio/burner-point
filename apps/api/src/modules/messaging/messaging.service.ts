import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import { ProviderName, ProviderService, RouteProduct } from '../global/provider.service';

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
  countryCode?: string;
  product?: RouteProduct;
  preferredProvider?: ProviderName;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private providerService: ProviderService,
  ) {
    // SMTP fallback is kept for resilience; Resend API is preferred when configured.
    this.emailTransporter = nodemailer.createTransport({
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
      const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
      if (resendApiKey) {
        const from = options.from ||
          this.configService.get<string>('EMAIL_FROM') ||
          this.configService.get<string>('SMTP_FROM') ||
          'Burner Point <noreply@burnerpoint.app>';
        const result = await axios.post(
          'https://api.resend.com/emails',
          {
            from,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
          },
          {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const messageId = String(result.data?.id || '');
        this.logger.log(`Email sent through Resend: ${messageId} to ${options.to}`);
        return { messageId };
      }

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
        <a href="${this.configService.get('WEB_URL')}/dashboard/billing"
           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Open Billing
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

  async sendSMS(options: SMSOptions) {
    const from =
      options.from ||
      this.configService.get<string>('SMS_DEFAULT_FROM') ||
      this.configService.get<string>('TWILIO_DEFAULT_FROM') ||
      this.configService.get<string>('TELNYX_DEFAULT_FROM') ||
      this.configService.get<string>('TREMIL_DEFAULT_FROM');

    if (!from) {
      throw new Error('SMS sender not configured. Set SMS_DEFAULT_FROM or a provider-specific sender.');
    }

    const result = await this.providerService.sendSms(options.to, from, options.body, {
      countryCode: options.countryCode,
      product: options.product ?? RouteProduct.CONVERSATION,
      preferredProvider: options.preferredProvider,
    });

    this.logger.log(`SMS queued through ${result.provider}: ${result.sid}`);
    return result;
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
