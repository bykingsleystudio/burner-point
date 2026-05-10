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

export interface SupportIntakeOptions {
  name: string;
  email: string;
  message: string;
  product?: string;
  reference?: string;
  source?: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly emailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private providerService: ProviderService,
  ) {
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT', '465'), 10),
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<{ messageId: string }> {
    try {
      const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
      if (resendApiKey) {
        const from = options.from ||
          this.configService.get<string>('RESEND_FROM_EMAIL') ||
          this.configService.get<string>('EMAIL_FROM') ||
          this.configService.get<string>('SMTP_FROM') ||
          'Burner Point <no-reply@burnerpoint.com>';

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

      const result = await this.emailTransporter.sendMail({
        from: options.from || this.configService.get('SMTP_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent successfully: ${result.messageId} to ${options.to}`);
      return { messageId: result.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = this.wrapBrandedEmail(
      `Welcome to Burner Point, ${this.escapeHtml(firstName)}.`,
      [
        'Your account is ready. From here you can fund your wallet, verify a phone number, rent private numbers, and manage connectivity products from one account.',
        'You can now:',
      ],
      `
        <ul style="margin: 16px 0 0; color: #E5E7EB; line-height: 1.8;">
          <li>Purchase verification credits</li>
          <li>Rent private phone numbers</li>
          <li>Activate subscriptions and connectivity products</li>
        </ul>
        <a href="${this.getWebUrl()}/dashboard"
           style="display: inline-block; margin-top: 20px; background-color: #00FF9D; color: #000000; padding: 12px 20px; text-decoration: none; border-radius: 12px; font-weight: 700;">
          Open Dashboard
        </a>
      `,
    );

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Burner Point',
      html,
    });
  }

  async sendPaymentConfirmation(email: string, amount: number, reference: string): Promise<void> {
    const html = this.wrapBrandedEmail(
      'Payment confirmed.',
      [
        `Your payment of $${(amount / 100).toFixed(2)} has been processed successfully.`,
        `Reference: ${this.escapeHtml(reference)}`,
        'Wallet credits or product access will appear in your account as soon as fulfillment completes.',
      ],
      `
        <a href="${this.getWebUrl()}/dashboard/billing"
           style="display: inline-block; margin-top: 20px; background-color: #00FF9D; color: #000000; padding: 12px 20px; text-decoration: none; border-radius: 12px; font-weight: 700;">
          Open Billing
        </a>
      `,
    );

    await this.sendEmail({
      to: email,
      subject: 'Burner Point payment confirmation',
      html,
    });
  }

  async sendOTPEmail(email: string, otp: string): Promise<void> {
    const html = this.wrapBrandedEmail(
      'Your verification code.',
      [
        'Use the following code to verify your email address.',
      ],
      `
        <div style="font-size: 28px; font-weight: 700; background-color: #013220; color: #00FF9D; padding: 20px; text-align: center; border-radius: 12px; margin: 20px 0;">
          ${this.escapeHtml(otp)}
        </div>
        <p style="margin: 0; color: #E5E7EB;">This code will expire in 10 minutes.</p>
        <p style="margin: 16px 0 0; color: #E5E7EB;">If you did not request this code, you can ignore this email.</p>
      `,
    );

    await this.sendEmail({
      to: email,
      subject: 'Your Burner Point verification code',
      html,
    });
  }

  async sendSupportIntake(input: SupportIntakeOptions): Promise<void> {
    const recipient =
      this.configService.get<string>('SUPPORT_EMAIL') ||
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'info@burnerpoint.com';

    const html = this.wrapBrandedEmail(
      'New support request.',
      [
        `Name: ${this.escapeHtml(input.name)}`,
        `Email: ${this.escapeHtml(input.email)}`,
        `Product: ${this.escapeHtml(input.product || 'General')}`,
        `Reference: ${this.escapeHtml(input.reference || 'Not provided')}`,
        `Source: ${this.escapeHtml(input.source || 'web_contact_form')}`,
      ],
      `
        <div style="margin-top: 24px; padding: 20px; border-radius: 16px; background: #07140f; border: 1px solid rgba(0,255,157,0.16); color: #E5E7EB; line-height: 1.8;">
          ${this.escapeHtml(input.message).replace(/\n/g, '<br />')}
        </div>
      `,
    );

    const text = [
      'Burner Point Support Intake',
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Product: ${input.product || 'General'}`,
      `Reference: ${input.reference || 'Not provided'}`,
      `Source: ${input.source || 'web_contact_form'}`,
      '',
      input.message,
    ].join('\n');

    await this.sendEmail({
      to: recipient,
      subject: `Burner Point support request: ${input.product || 'general'}`,
      html,
      text,
    });
  }

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

  async sendBulkEmail(emails: EmailOptions[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.sendEmail(email);
        success += 1;
      } catch (error) {
        this.logger.error(`Failed to send bulk email to ${email.to}`, error);
        failed += 1;
      }
    }

    return { success, failed };
  }

  private wrapBrandedEmail(title: string, paragraphs: string[], extraHtml = '') {
    const content = paragraphs
      .map((paragraph) => `<p style="margin: 16px 0 0; color: #E5E7EB; line-height: 1.8;">${paragraph}</p>`)
      .join('');

    return `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #000000; color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
        <div style="padding: 32px;">
          <p style="margin: 0; color: #00FF9D; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Burner Point</p>
          <h1 style="margin: 16px 0 0; font-size: 32px; line-height: 1.1;">${title}</h1>
          ${content}
          ${extraHtml}
        </div>
      </div>
    `;
  }

  private getWebUrl(): string {
    const configured =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('WEB_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_APP_URL');

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('APP_URL must be configured before sending customer emails');
    }

    return 'http://localhost:3000';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
