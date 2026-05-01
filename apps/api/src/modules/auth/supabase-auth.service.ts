/**
 * Supabase Authentication Service
 * 
 * Handles all authentication flows using Supabase Auth:
 * - Email/Password authentication
 * - Phone OTP authentication
 * - OAuth providers (Google, Apple, Microsoft)
 * - Session management
 * - Password reset
 * - Email verification
 * 
 * Security features:
 * - Rate limiting on auth endpoints
 * - Account lockout after failed attempts
 * - Secure password hashing (bcrypt)
 * - JWT session tokens
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../database/entities/user.entity';
import { RedisService } from '../global/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { withWalletPresentation } from '../../config/money';
import { resolveJwtRefreshSecret } from '../../config/runtime-env';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const OTP_EXPIRY_SECONDS = 300; // 5 minutes

@Injectable()
export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.supabase = this.initializeSupabaseClient();
  }

  private initializeSupabaseClient(): SupabaseClient {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      throw new InternalServerErrorException(
        'Supabase configuration missing. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
      );
    }

    return createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }

  /**
   * Register a new user with email/password
   */
  async register(dto: RegisterDto, ip?: string) {
    const email = this.normalizeEmail(dto.email);
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
    const existing = await this.userRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (existing?.email === email)
      throw new ConflictException('Email already registered');
    if (existing?.phoneNumber === phoneNumber)
      throw new ConflictException('Phone number already registered');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password: dto.password,
      options: {
        data: {
          first_name: dto.firstName.trim(),
          last_name: dto.lastName.trim(),
          phone_number: phoneNumber,
          country: dto.country || 'NG',
        },
      },
    });

    if (authError || !authData.user) {
      throw new BadRequestException(
        authError?.message || 'Failed to create account'
      );
    }

    // Create user record in database
    const referralCode = this.generateReferralCode();
    const user = this.userRepo.create({
      id: authData.user.id,
      email,
      phoneNumber,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      country: dto.country || 'NG',
      referralCode,
      status: UserStatus.PENDING, // Pending until email verified
      lastLoginIp: ip,
      emailVerified: false,
      phoneVerified: false,
      preferences: {
        termsAccepted: true,
        privacyAccepted: true,
        authProvider: 'supabase',
        termsAcceptedAt: new Date().toISOString(),
        privacyAcceptedAt: new Date().toISOString(),
      },
    });

    // Handle referral
    if (dto.referralCode) {
      const referrer = await this.userRepo.findOne({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) user.referredByUserId = referrer.id;
    }

    await this.userRepo.save(user);
    return this.generateTokens(user);
  }

  /**
   * Login with email/password or phone/password
   */
  async login(dto: LoginDto, ip?: string) {
    const identifier = dto.identifier || dto.email || dto.phoneNumber;
    if (!identifier)
      throw new BadRequestException('Email or phone number is required');

    const normalizedIdentifier = this.normalizeLoginIdentifier(identifier);
    const isEmail = normalizedIdentifier.includes('@');
    
    // Find user
    const where = isEmail
      ? { email: normalizedIdentifier }
      : { phoneNumber: normalizedIdentifier };

    const user = await this.userRepo.findOne({
      where,
      select: [
        'id',
        'email',
        'passwordHash',
        'status',
        'twoFactorEnabled',
        'twoFactorSecret',
        'failedLoginAttempts',
        'lockedUntil',
        'role',
      ],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new ForbiddenException(
        `Account locked. Try again in ${remaining} minutes.`
      );
    }

    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException('Account banned');
    if (user.status === UserStatus.SUSPENDED)
      throw new ForbiddenException('Account suspended');
    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Authenticate with Supabase
    const { error: signInError } = await this.supabase.auth.signInWithPassword({
      email: isEmail ? normalizedIdentifier : undefined,
      phone: !isEmail ? normalizedIdentifier : undefined,
      password: dto.password,
    });

    if (signInError) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException(signInError.message);
    }

    if (user.twoFactorEnabled)
      throw new ForbiddenException('Additional verification required');

    // Reset failed attempts on success
    await this.userRepo.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    return this.generateTokens(user);
  }

  /**
   * Send phone OTP
   */
  async sendPhoneOtp(phoneNumber: string) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    const { error } = await this.supabase.auth.signInWithOtp({
      phone: normalizedPhone,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, message: 'OTP sent successfully' };
  }

  /**
   * Verify phone OTP
   */
  async verifyPhoneOtp(phoneNumber: string, otp: string) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    const { data, error } = await this.supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: otp,
      type: 'sms',
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Update user phone verification status
    await this.userRepo.update(data.user.id, {
      phoneVerified: true,
    });

    const user = await this.userRepo.findOne({ where: { id: data.user.id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    
    const { error } = await this.supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${process.env.APP_URL}/auth/reset-password`,
      }
    );

    if (error) {
      // Don't reveal if email exists
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    return { success: true, message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * OAuth login (Google, Apple, Microsoft)
   */
  async oauthLogin(provider: 'google' | 'apple' | 'microsoft') {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.APP_URL}/auth/callback`,
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { url: data.url };
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: resolveJwtRefreshSecret(this.configService),
      });

      // Check if refresh token is revoked
      const isRevoked = await this.redisService.get(
        `revoked:${refreshToken.slice(-20)}`
      );
      if (isRevoked) throw new UnauthorizedException('Token revoked');

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException('User not found');

      // Revoke old refresh token
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(
          `revoked:${refreshToken.slice(-20)}`,
          '1',
          ttl
        );
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout and revoke tokens
   */
  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: resolveJwtRefreshSecret(this.configService),
      });
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(
          `revoked:${refreshToken.slice(-20)}`,
          '1',
          ttl
        );
      }
    } catch {
      // already expired, nothing to revoke
    }
    return { success: true };
  }

  /**
   * Validate user credentials
   */
  async validateUser(
    identifier: string,
    password: string
  ): Promise<User | null> {
    const normalizedIdentifier = this.normalizeLoginIdentifier(identifier);
    const isEmail = normalizedIdentifier.includes('@');
    const where = isEmail
      ? { email: normalizedIdentifier }
      : { phoneNumber: normalizedIdentifier };

    const user = await this.userRepo.findOne({
      where,
      select: ['id', 'email', 'passwordHash', 'status', 'role'],
    });

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: resolveJwtRefreshSecret(this.configService),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken, userId: user.id };
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(user: User) {
    const attempts = user.failedLoginAttempts + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      update.failedLoginAttempts = 0;
    }
    await this.userRepo.update(user.id, update);
  }

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    return Math.random().toString(36).slice(2, 9).toUpperCase();
  }

  /**
   * Normalize email
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Normalize phone number
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    const compact = phoneNumber.trim().replace(/[^\d+]/g, '');
    const normalized = compact.startsWith('00')
      ? `+${compact.slice(2)}`
      : compact;
    return normalized.startsWith('+')
      ? `+${normalized.slice(1).replace(/\+/g, '')}`
      : normalized.replace(/\+/g, '');
  }

  /**
   * Normalize login identifier
   */
  private normalizeLoginIdentifier(identifier: string): string {
    const trimmed = identifier.trim();
    return trimmed.includes('@')
      ? this.normalizeEmail(trimmed)
      : this.normalizePhoneNumber(trimmed);
  }
}
