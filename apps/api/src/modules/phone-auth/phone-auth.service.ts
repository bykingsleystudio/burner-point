import {
  Injectable,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { PhoneOtpSession } from '../../database/entities/extended-entities';
import { User } from '../../database/entities/user.entity';

const MAX_SENDS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 3;
const OTP_TTL_MINUTES = 10;
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

@Injectable()
export class PhoneAuthService {
  private readonly logger = new Logger(PhoneAuthService.name);
  private twilioClientInstance: twilio.Twilio | null = null;

  constructor(
    @InjectRepository(PhoneOtpSession) private sessionRepo: Repository<PhoneOtpSession>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private configService: ConfigService,
  ) {}

  async sendOtp(userId: string, phoneNumber: string, channel: 'sms' | 'call', ip?: string) {
    const client = this.getTwilioClientOrThrow();
    const verifyServiceSid = this.getVerifyServiceSidOrThrow();
    const normalizedPhone = this.normalizePhone(phoneNumber);
    await this.assertUserCanVerifyPhone(userId, normalizedPhone);

    const windowStart = new Date(Date.now() - OTP_TTL_MINUTES * 60 * 1000);
    const recentSends = await this.sessionRepo.count({
      where: {
        userId,
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

    try {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({ to: normalizedPhone, channel });

      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
      const session = this.sessionRepo.create({
        userId,
        phoneNumber: normalizedPhone,
        channel,
        verificationSid: verification.sid,
        status: 'pending',
        ipAddress: ip,
        expiresAt,
      });
      await this.sessionRepo.save(session);

      return {
        success: true,
        channel,
        phoneNumber: normalizedPhone,
        status: 'pending',
        expiresInMinutes: OTP_TTL_MINUTES,
        expiresAt: expiresAt.toISOString(),
        attemptsRemaining: MAX_VERIFY_ATTEMPTS,
      };
    } catch (error) {
      this.handleTwilioError(error, 'send verification code');
    }
  }

  async verifyOtp(userId: string, phoneNumber: string, code: string) {
    const client = this.getTwilioClientOrThrow();
    const verifyServiceSid = this.getVerifyServiceSidOrThrow();
    const normalizedPhone = this.normalizePhone(phoneNumber);
    await this.assertUserCanVerifyPhone(userId, normalizedPhone);

    const session = await this.sessionRepo.findOne({
      where: { userId, phoneNumber: normalizedPhone, status: 'pending' },
      order: { createdAt: 'DESC' },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        session.status = 'expired';
        await this.sessionRepo.save(session);
      }
      throw new BadRequestException('OTP session expired or not found. Request a new code.');
    }

    if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
      session.status = 'failed';
      await this.sessionRepo.save(session);
      throw new HttpException(
        'Too many invalid verification attempts. Please request a new code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let result: { status: string };
    try {
      result = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({ to: normalizedPhone, code: code.trim() });
    } catch (error) {
      this.handleTwilioError(error, 'verify code');
    }

    if (result.status !== 'approved') {
      session.attempts += 1;
      if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
        session.status = 'failed';
      }
      await this.sessionRepo.save(session);
      throw new BadRequestException({
        message: 'Invalid OTP code',
        attemptsRemaining: Math.max(0, MAX_VERIFY_ATTEMPTS - session.attempts),
      });
    }

    session.status = 'approved';
    await this.sessionRepo.save(session);

    await this.userRepo.update(
      { id: userId, phoneNumber: normalizedPhone },
      { phoneVerified: true },
    );

    return {
      success: true,
      phoneNumber: normalizedPhone,
      status: 'approved',
      redirectTo: '/dashboard',
    };
  }

  private getTwilioClientOrThrow(): twilio.Twilio {
    if (this.twilioClientInstance) return this.twilioClientInstance;

    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (!sid || !token) {
      throw new BadRequestException('Phone auth is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN on the API service.');
    }

    this.twilioClientInstance = twilio(sid, token);
    return this.twilioClientInstance;
  }

  private getVerifyServiceSidOrThrow(): string {
    const verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID');
    if (!verifyServiceSid) {
      throw new BadRequestException('Phone auth is not configured. Set TWILIO_VERIFY_SERVICE_SID on the API service.');
    }
    return verifyServiceSid;
  }

  private async assertUserCanVerifyPhone(userId: string, normalizedPhone: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const accountPhone = user.phoneNumber ? this.normalizePhone(user.phoneNumber) : null;
    if (accountPhone && accountPhone !== normalizedPhone) {
      throw new BadRequestException('Use the phone number on your Burner Point profile, or update your profile before requesting OTP.');
    }

    if (!accountPhone) {
      user.phoneNumber = normalizedPhone;
      user.phoneVerified = false;
      await this.userRepo.save(user);
    }
  }

  private normalizePhone(phoneNumber: string) {
    const normalized = phoneNumber.trim().replace(/[^\d+]/g, '');
    if (!E164_PATTERN.test(normalized)) {
      throw new BadRequestException('Phone number must be in E.164 format, for example +14155550182.');
    }
    return normalized;
  }

  private handleTwilioError(error: unknown, action: string): never {
    const err = error as { status?: number; code?: number; message?: string };
    this.logger.warn(`Twilio Verify failed to ${action}: status=${err.status ?? 'unknown'} code=${err.code ?? 'unknown'}`);

    if (err.status === 429) {
      throw new HttpException(
        'Twilio is rate limiting this verification. Please wait before trying again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (err.status === 400 || err.code === 60200 || err.code === 60203) {
      throw new BadRequestException('Unable to send or verify this phone number. Check the number and try again.');
    }

    throw new BadRequestException('Phone verification is temporarily unavailable. Please try again shortly.');
  }
}
