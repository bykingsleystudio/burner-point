import { Injectable, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { PhoneOtpSession } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';

const MAX_SENDS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 3;
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

  async sendOtp(phoneNumber: string, channel: 'sms' | 'call', ip?: string) {
    this.ensureConfigured();
    const normalizedPhone = this.normalizePhone(phoneNumber);
    const windowStart = new Date(Date.now() - OTP_TTL_MINUTES * 60 * 1000);
    const recentSends = await this.sessionRepo.count({
      where: {
        phoneNumber: normalizedPhone,
        createdAt: MoreThan(windowStart),
      },
    });

    if (recentSends >= MAX_SENDS_PER_WINDOW) {
      throw new HttpException(
        'Too many OTP send attempts. Please try again in 10 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const verification = await this.twilioClient.verify.v2
      .services(this.verifyServiceSid)
      .verifications.create({ to: normalizedPhone, channel });

    const session = this.sessionRepo.create({
      phoneNumber: normalizedPhone,
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
    this.ensureConfigured();
    const normalizedPhone = this.normalizePhone(phoneNumber);
    const session = await this.sessionRepo.findOne({
      where: { phoneNumber: normalizedPhone, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        session.status = 'expired';
        await this.sessionRepo.save(session);
      }
      throw new BadRequestException('OTP session expired or not found');
    }

    if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Too many invalid verification attempts. Please request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.twilioClient.verify.v2
      .services(this.verifyServiceSid)
      .verificationChecks.create({ to: normalizedPhone, code: code.trim() });

    if (result.status !== 'approved') {
      session.attempts += 1;
      await this.sessionRepo.save(session);
      throw new BadRequestException('Invalid OTP code');
    }

    // Mark session as approved
    session.status = 'approved';
    await this.sessionRepo.save(session);

    // Mark user's phone as verified
    await this.userRepo.update({ phoneNumber: normalizedPhone }, { phoneVerified: true });

    return { success: true, phoneNumber: normalizedPhone };
  }

  private ensureConfigured() {
    if (!this.twilioClient || !this.verifyServiceSid) {
      throw new BadRequestException('Phone auth is not configured');
    }
  }

  private normalizePhone(phoneNumber: string) {
    return phoneNumber.trim().replace(/[^\d+]/g, '');
  }
}
