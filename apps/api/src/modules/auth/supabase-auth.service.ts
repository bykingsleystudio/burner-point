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
import { SupabaseClient } from '@supabase/supabase-js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../database/entities/user.entity';
import { RedisService } from '../global/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { withWalletPresentation } from '../../config/money';
import { resolveJwtRefreshSecret } from '../../config/runtime-env';
import { createSupabaseFromConfig } from '../../config/supabase';

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
    try {
      return createSupabaseFromConfig(this.configService);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Supabase configuration missing. Ensure SUPABASE_URL and a server-side Supabase key are set.',
      );
    }
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

    let user = await this.userRepo.findOne({ where });

    // Check account lock
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      throw new ForbiddenException(
        `Account locked. Try again in ${remaining} minutes.`
      );
    }

    if (user?.status === UserStatus.BANNED)
      throw new ForbiddenException('Account banned');
    if (user?.status === UserStatus.SUSPENDED)
      throw new ForbiddenException('Account suspended');

    // Authenticate with Supabase
    const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
      email: isEmail ? normalizedIdentifier : undefined,
      phone: !isEmail ? normalizedIdentifier : undefined,
      password: dto.password,
    });

    if (signInError) {
      if (user) await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!signInData.user) {
      if (user) await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user && user.id !== signInData.user.id) {
      throw new ConflictException('Supabase account is linked to a different Burner Point user record.');
    }

    user = await this.syncLocalUserFromSupabaseAuthUser(signInData.user, user, ip);

    if (user.status === UserStatus.BANNED)
      throw new ForbiddenException('Account banned');
    if (user.status === UserStatus.SUSPENDED)
      throw new ForbiddenException('Account suspended');

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
        redirectTo: `${this.getWebUrl()}/auth/reset-password`,
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
    const supabaseProvider = provider === 'microsoft' ? 'azure' : provider;

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: `${this.getWebUrl()}/auth/callback`,
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { url: data.url };
  }

  /**
   * Exchange a Supabase browser session for Burner Point API tokens.
   * This lets web/mobile clients authenticate with Supabase directly
   * and then bootstrap the API's JWT session for protected routes.
   */
  async exchangeSupabaseSession(
    accessToken: string,
    profile?: Partial<{
      email: string;
      phoneNumber: string;
      firstName: string;
      lastName: string;
      country: string;
      acceptTerms: boolean;
      acceptPrivacy: boolean;
    }>,
    ip?: string,
  ) {
    const token = accessToken?.trim();
    if (!token) {
      throw new BadRequestException('Supabase access token is required.');
    }

    const { data, error } = await this.supabase.auth.getUser(token);
    const authUser = data.user;
    if (error || !authUser) {
      throw new UnauthorizedException('Invalid Supabase session');
    }

    const metadata = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const primaryEmail = authUser.email ?? profile?.email;
    if (!primaryEmail) {
      throw new BadRequestException('Supabase user must have an email address before using Burner Point.');
    }

    const primaryPhone =
      authUser.phone
      ?? this.asOptionalString(metadata.phone_number)
      ?? this.asOptionalString(metadata.phoneNumber)
      ?? profile?.phoneNumber;
    const email = this.normalizeEmail(primaryEmail);
    const phoneNumber = primaryPhone ? this.normalizePhoneNumber(primaryPhone) : undefined;
    const firstName = this.normalizeOptionalText(
      profile?.firstName,
      this.asOptionalString(metadata.first_name),
      this.asOptionalString(metadata.firstName),
    );
    const lastName = this.normalizeOptionalText(
      profile?.lastName,
      this.asOptionalString(metadata.last_name),
      this.asOptionalString(metadata.lastName),
    );
    const country = this.normalizeOptionalText(
      profile?.country,
      this.asOptionalString(metadata.country),
    ) || 'NG';
    const existingById = await this.userRepo.findOne({ where: { id: authUser.id } });
    const existingByEmail = await this.userRepo.findOne({ where: { email } });
    const existingByPhone = phoneNumber ? await this.userRepo.findOne({ where: { phoneNumber } }) : null;

    if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
      throw new ConflictException('This email address and phone number are already linked to different Burner Point accounts.');
    }

    let user = existingById || existingByEmail || existingByPhone;
    if (user?.status === UserStatus.BANNED) {
      throw new ForbiddenException('Account banned');
    }
    if (user?.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Account suspended');
    }

    const termsAccepted =
      Boolean(profile?.acceptTerms) ||
      Boolean(metadata.acceptTerms) ||
      Boolean(metadata.accept_terms) ||
      Boolean((user?.preferences as any)?.termsAccepted);
    const privacyAccepted =
      Boolean(profile?.acceptPrivacy) ||
      Boolean(metadata.acceptPrivacy) ||
      Boolean(metadata.accept_privacy) ||
      Boolean((user?.preferences as any)?.privacyAccepted);
    const effectivePhoneNumber = phoneNumber || user?.phoneNumber;
    const missingFields = this.getMissingProfileFields({
      firstName,
      lastName,
      email,
      phoneNumber: effectivePhoneNumber,
      termsAccepted,
      privacyAccepted,
    });
    const profileComplete = missingFields.length === 0;
    const emailVerified = Boolean(
      (authUser as { email_confirmed_at?: string | null }).email_confirmed_at ||
      (authUser as { confirmed_at?: string | null }).confirmed_at,
    );
    const phoneVerified = Boolean(
      (authUser as { phone_confirmed_at?: string | null }).phone_confirmed_at,
    );
    const now = new Date().toISOString();
    const preferences = {
      ...(user?.preferences || {}),
      supabaseUserId: authUser.id,
      supabaseProvider:
        this.asOptionalString((authUser.app_metadata as Record<string, unknown> | undefined)?.provider)
        ?? (Array.isArray(authUser.identities) ? authUser.identities[0]?.provider : undefined)
        ?? 'email',
      termsAccepted,
      privacyAccepted,
      termsAcceptedAt: (user?.preferences as any)?.termsAcceptedAt ?? (termsAccepted ? now : null),
      privacyAcceptedAt: (user?.preferences as any)?.privacyAcceptedAt ?? (privacyAccepted ? now : null),
      onboardingComplete: profileComplete,
      onboardingMissingFields: missingFields,
      pendingPhoneNumber: effectivePhoneNumber ?? null,
      authProvider: 'supabase',
    };

    if (!user) {
      user = this.userRepo.create({
        id: authUser.id,
        email,
        phoneNumber: effectivePhoneNumber,
        firstName,
        lastName,
        country,
        referralCode: this.generateReferralCode(),
        status: profileComplete ? UserStatus.ACTIVE : UserStatus.PENDING,
        emailVerified,
        phoneVerified,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        preferences,
      });
    } else {
      const phoneChanged = Boolean(
        effectivePhoneNumber &&
        user.phoneNumber &&
        user.phoneNumber !== effectivePhoneNumber,
      );

      user.email = user.email || email;
      user.phoneNumber = effectivePhoneNumber || user.phoneNumber;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.country = country || user.country;
      user.status = profileComplete ? UserStatus.ACTIVE : user.status;
      user.emailVerified = user.emailVerified || emailVerified;
      user.phoneVerified = phoneChanged ? phoneVerified : (user.phoneVerified || phoneVerified);
      user.lastLoginAt = new Date();
      user.lastLoginIp = ip;
      user.preferences = preferences;
    }

    await this.userRepo.save(user);
    const tokens = await this.generateTokens(user);
    const needsPhoneVerification = Boolean(user.phoneNumber) && !user.phoneVerified;

    return {
      ...tokens,
      user: withWalletPresentation(user, this.configService),
      needsOnboarding: !profileComplete,
      needsPhoneVerification,
      onboarding: {
        complete: profileComplete,
        missingFields,
      },
    };
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

  private async syncLocalUserFromSupabaseAuthUser(
    authUser: {
      id: string;
      email?: string | null;
      phone?: string | null;
      user_metadata?: Record<string, unknown>;
      app_metadata?: Record<string, unknown>;
      identities?: Array<{ provider?: string }>;
      email_confirmed_at?: string | null;
      phone_confirmed_at?: string | null;
      confirmed_at?: string | null;
    },
    existingUser?: User | null,
    ip?: string,
  ) {
    const metadata = authUser.user_metadata ?? {};
    const email = authUser.email ? this.normalizeEmail(authUser.email) : existingUser?.email;
    if (!email) {
      throw new BadRequestException('Supabase user must have an email address before using Burner Point.');
    }

    const metadataPhone =
      this.asOptionalString(metadata.phone_number) ||
      this.asOptionalString(metadata.phoneNumber);
    const phoneNumber = authUser.phone || metadataPhone
      ? this.normalizePhoneNumber(String(authUser.phone || metadataPhone))
      : existingUser?.phoneNumber;
    const firstName = this.normalizeOptionalText(
      existingUser?.firstName,
      this.asOptionalString(metadata.first_name),
      this.asOptionalString(metadata.firstName),
    );
    const lastName = this.normalizeOptionalText(
      existingUser?.lastName,
      this.asOptionalString(metadata.last_name),
      this.asOptionalString(metadata.lastName),
    );
    const country = this.normalizeOptionalText(
      existingUser?.country,
      this.asOptionalString(metadata.country),
    ) || 'NG';
    const emailVerified = Boolean(authUser.email_confirmed_at || authUser.confirmed_at);
    const phoneVerified = Boolean(authUser.phone_confirmed_at);
    const provider =
      this.asOptionalString(authUser.app_metadata?.provider) ||
      authUser.identities?.[0]?.provider ||
      'email';
    const termsAccepted =
      Boolean((existingUser?.preferences as any)?.termsAccepted) ||
      Boolean(metadata.acceptTerms) ||
      Boolean(metadata.accept_terms);
    const privacyAccepted =
      Boolean((existingUser?.preferences as any)?.privacyAccepted) ||
      Boolean(metadata.acceptPrivacy) ||
      Boolean(metadata.accept_privacy);
    const missingFields = this.getMissingProfileFields({
      firstName,
      lastName,
      email,
      phoneNumber,
      termsAccepted,
      privacyAccepted,
    });
    const profileComplete = missingFields.length === 0;
    const preferences = {
      ...(existingUser?.preferences || {}),
      supabaseUserId: authUser.id,
      supabaseProvider: provider,
      authProvider: 'supabase',
      termsAccepted,
      privacyAccepted,
      onboardingComplete: profileComplete,
      onboardingMissingFields: missingFields,
      pendingPhoneNumber: phoneNumber ?? null,
    };

    if (existingUser) {
      existingUser.email = existingUser.email || email;
      existingUser.phoneNumber = existingUser.phoneNumber || phoneNumber;
      existingUser.firstName = existingUser.firstName || firstName;
      existingUser.lastName = existingUser.lastName || lastName;
      existingUser.country = existingUser.country || country;
      existingUser.status = profileComplete ? UserStatus.ACTIVE : existingUser.status;
      existingUser.emailVerified = existingUser.emailVerified || emailVerified;
      existingUser.phoneVerified = existingUser.phoneVerified || phoneVerified;
      existingUser.lastLoginAt = new Date();
      existingUser.lastLoginIp = ip;
      existingUser.preferences = preferences;
      return this.userRepo.save(existingUser);
    }

    const created = this.userRepo.create({
      id: authUser.id,
      email,
      phoneNumber,
      firstName,
      lastName,
      country,
      referralCode: this.generateReferralCode(),
      status: profileComplete ? UserStatus.ACTIVE : UserStatus.PENDING,
      emailVerified,
      phoneVerified,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      preferences,
    });

    return this.userRepo.save(created);
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

  private getWebUrl(): string {
    const configured =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('WEB_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_APP_URL');

    if (configured) {
      return configured.replace(/\/+$/, '');
    }

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new BadRequestException('APP_URL must be configured before starting auth redirects');
    }

    return 'https://burnerpoint.com';
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

  private normalizeOptionalText(...values: Array<string | undefined | null>) {
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const normalized = value.trim();
      if (normalized) return normalized;
    }
    return '';
  }

  private asOptionalString(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }

  private getMissingProfileFields(profile: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
  }) {
    const missing: string[] = [];

    if (!profile.firstName?.trim()) missing.push('firstName');
    if (!profile.lastName?.trim()) missing.push('lastName');
    if (!profile.email?.trim()) missing.push('email');
    if (!profile.phoneNumber?.trim()) missing.push('phoneNumber');
    if (!profile.termsAccepted) missing.push('acceptTerms');
    if (!profile.privacyAccepted) missing.push('acceptPrivacy');

    return missing;
  }
}
