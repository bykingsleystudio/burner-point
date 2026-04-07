import { Injectable, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { PhoneOtpSession } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';

const MAX_ATTEMPTS = 3;
const OTP_TTL_MINUTES = 10;

@Injectable()
export class PhoneAuthService {
  private readonly logger = new Logger(PhoneAuthService.name);
  private _twilioClient: twilio.Twilio | null = null;
  private verifyServiceSid: string;

  constructor(
    @InjectRepository(PhoneOtpSession) private sessionRepo: Repository<PhoneOtpSession>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {
    this.verifyServiceSid = configService.get('TWILIO_VERIFY_SERVICE_SID');
  }

  private get twilioClient(): twilio.Twilio | null {
    if (this._twilioClient) return this._twilioClient;
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!sid || !token) return null;
    this._twilioClient = twilio(sid, token);
    return this._twilioClient;
  }

  async sendOtp(phoneNumber: string, channel: 'sms' | 'call' | 'whatsapp', ip?: string) {
    if (!this.twilioClient) throw new BadRequestException('Phone auth not configured');
    // Check for existing pending session (rate limit: max 3 sends per 10 minutes)
    const existing = await this.sessionRepo.findOne({
      where: { phoneNumber, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    if (existing && existing.attempts >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many OTP attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Send via Twilio Verify
    const verification = await this.twilioClient.verify.v2
      .services(this.verifyServiceSid)
      .verifications.create({ to: phoneNumber, channel });

    // Save session
    const session = this.sessionRepo.create({
      phoneNumber,
      channel,
      verificationSid: verification.sid,
      status: 'pending',
      ipAddress: ip,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    });
    await this.sessionRepo.save(session);

    return { success: true, channel, expiresInMinutes: OTP_TTL_MINUTES };
  }

  async verifyOtp(phoneNumber: string, code: string) {
    if (!this.twilioClient) throw new BadRequestException('Phone auth not configured');
    const session = await this.sessionRepo.findOne({
      where: { phoneNumber, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new BadRequestException('OTP session expired or not found');
    }

    // Verify with Twilio
    const result = await this.twilioClient.verify.v2
      .services(this.verifyServiceSid)
      .verificationChecks.create({ to: phoneNumber, code });

    if (result.status !== 'approved') {
      session.attempts += 1;
      await this.sessionRepo.save(session);
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark session as approved
    session.status = 'approved';
    await this.sessionRepo.save(session);

    // Mark user's phone as verified
    await this.userRepo.update({ phoneNumber }, { phoneVerified: true });

    return { success: true, phoneNumber };
  }
}
