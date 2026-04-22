import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken } from '@clerk/backend';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../database/entities/user.entity';
import { RedisService } from '../global/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto, ip?: string) {
    const email = this.normalizeEmail(dto.email);
    const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
    const existing = await this.userRepo.findOne({
      where: [{ email }, { phoneNumber }],
    });
    if (existing?.email === email) throw new ConflictException('Email already registered');
    if (existing?.phoneNumber === phoneNumber) throw new ConflictException('Phone number already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const referralCode = this.generateReferralCode();

    const user = this.userRepo.create({
      email,
      phoneNumber,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      country: dto.country || 'NG',
      referralCode,
      status: UserStatus.ACTIVE,
      lastLoginIp: ip,
      emailVerified: false,
      phoneVerified: false,
      preferences: {
        termsAccepted: true,
        privacyAccepted: true,
        authProvider: 'password',
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

  async login(dto: LoginDto, ip?: string) {
    const identifier = dto.identifier || dto.email || dto.phoneNumber;
    if (!identifier) throw new BadRequestException('Email or phone number is required');
    const normalizedIdentifier = this.normalizeLoginIdentifier(identifier);
    const where = normalizedIdentifier.includes('@')
      ? { email: normalizedIdentifier }
      : { phoneNumber: normalizedIdentifier };

    const user = await this.userRepo.findOne({
      where,
      select: ['id', 'email', 'passwordHash', 'status', 'twoFactorEnabled',
               'twoFactorSecret', 'failedLoginAttempts', 'lockedUntil', 'role'],
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Account locked. Try again in ${remaining} minutes.`);
    }

    if (user.status === UserStatus.BANNED) throw new ForbiddenException('Account banned');
    if (user.status === UserStatus.SUSPENDED) throw new ForbiddenException('Account suspended');
    if (!user.passwordHash) {
      throw new UnauthorizedException('Use Clerk sign-in for this account.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      throw new ForbiddenException('This account requires Clerk multifactor authentication. Sign in with Clerk to continue.');
    }

    // Reset failed attempts on success
    await this.userRepo.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    // TODO: 2FA check if enabled
    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token is revoked
      const isRevoked = await this.redisService.get(`revoked:${refreshToken.slice(-20)}`);
      if (isRevoked) throw new UnauthorizedException('Token revoked');

      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      // Revoke old refresh token
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(`revoked:${refreshToken.slice(-20)}`, '1', ttl);
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.set(`revoked:${refreshToken.slice(-20)}`, '1', ttl);
      }
    } catch { /* already expired, nothing to revoke */ }
    return { success: true };
  }

  async exchangeClerkSession(
    clerkToken: string,
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
    const secretKey = this.configService.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) {
      throw new BadRequestException('Clerk is not configured. Set CLERK_SECRET_KEY on the API service.');
    }

    const claims = await verifyToken(clerkToken, { secretKey });
    const clerkUserId = claims.sub;
    if (!clerkUserId) throw new UnauthorizedException('Invalid Clerk session');

    const clerkClient = createClerkClient({ secretKey });
    const clerkUser = await clerkClient.users.getUser(clerkUserId) as any;
    const unsafeMetadata = clerkUser.unsafeMetadata || {};
    const primaryEmail =
      clerkUser.emailAddresses?.find((entry: any) => entry.id === clerkUser.primaryEmailAddressId)?.emailAddress
      ?? clerkUser.emailAddresses?.[0]?.emailAddress
      ?? profile?.email;
    if (!primaryEmail) {
      throw new BadRequestException('Clerk user must have an email address before using Burner Point.');
    }

    const primaryPhone =
      clerkUser.phoneNumbers?.find((entry: any) => entry.id === clerkUser.primaryPhoneNumberId)?.phoneNumber
      ?? clerkUser.phoneNumbers?.[0]?.phoneNumber
      ?? this.asOptionalString(unsafeMetadata.phoneNumber)
      ?? profile?.phoneNumber;
    const email = this.normalizeEmail(primaryEmail);
    const phoneNumber = primaryPhone ? this.normalizePhoneNumber(primaryPhone) : undefined;
    const clerkPhoneVerified = this.isVerifiedClerkPhone(clerkUser, phoneNumber);
    const firstName = this.normalizeOptionalText(
      profile?.firstName,
      clerkUser.firstName,
      this.asOptionalString(unsafeMetadata.firstName),
    );
    const lastName = this.normalizeOptionalText(
      profile?.lastName,
      clerkUser.lastName,
      this.asOptionalString(unsafeMetadata.lastName),
    );
    const country = this.normalizeOptionalText(
      profile?.country,
      this.asOptionalString(unsafeMetadata.country),
    ) || 'NG';
    const existingByEmail = await this.userRepo.findOne({ where: { email } });
    const existingByPhone = phoneNumber ? await this.userRepo.findOne({ where: { phoneNumber } }) : null;
    if (existingByEmail && existingByPhone && existingByEmail.id !== existingByPhone.id) {
      throw new ConflictException('This email address and phone number are already linked to different Burner Point accounts.');
    }
    let user = existingByEmail || existingByPhone;
    const termsAccepted =
      Boolean(profile?.acceptTerms) ||
      Boolean(unsafeMetadata.acceptTerms) ||
      Boolean((user?.preferences as any)?.termsAccepted);
    const privacyAccepted =
      Boolean(profile?.acceptPrivacy) ||
      Boolean(unsafeMetadata.acceptPrivacy) ||
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

    const now = new Date().toISOString();
    const preferences = {
      ...(user?.preferences || {}),
      clerkUserId,
      clerkPrimaryEmailId: clerkUser.primaryEmailAddressId ?? null,
      clerkPrimaryPhoneId: clerkUser.primaryPhoneNumberId ?? null,
      termsAccepted,
      privacyAccepted,
      termsAcceptedAt: (user?.preferences as any)?.termsAcceptedAt ?? (termsAccepted ? now : null),
      privacyAcceptedAt: (user?.preferences as any)?.privacyAcceptedAt ?? (privacyAccepted ? now : null),
      referralCode: unsafeMetadata.referralCode ?? (user?.preferences as any)?.referralCode ?? null,
      onboardingComplete: profileComplete,
      onboardingMissingFields: missingFields,
      pendingPhoneNumber: effectivePhoneNumber ?? null,
      authProvider: 'clerk',
    };

    if (!user) {
      user = this.userRepo.create({
        email,
        phoneNumber: effectivePhoneNumber,
        firstName,
        lastName,
        country,
        referralCode: this.generateReferralCode(),
        status: profileComplete ? UserStatus.ACTIVE : UserStatus.PENDING,
        emailVerified: this.isVerifiedClerkEmail(clerkUser, email),
        phoneVerified: clerkPhoneVerified,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        preferences,
      });
    } else {
      const phoneChanged = Boolean(effectivePhoneNumber && user.phoneNumber && user.phoneNumber !== effectivePhoneNumber);
      user.email = user.email || email;
      user.phoneNumber = effectivePhoneNumber || user.phoneNumber;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.country = country || user.country;
      user.status = profileComplete ? UserStatus.ACTIVE : user.status;
      user.emailVerified = user.emailVerified || this.isVerifiedClerkEmail(clerkUser, email);
      user.phoneVerified = phoneChanged ? clerkPhoneVerified : (user.phoneVerified || clerkPhoneVerified);
      user.lastLoginAt = new Date();
      user.lastLoginIp = ip;
      user.preferences = preferences;
    }

    await this.userRepo.save(user);
    const tokens = await this.generateTokens(user);
    const needsPhoneVerification = Boolean(user.phoneNumber) && !user.phoneVerified;
    return {
      ...tokens,
      user,
      needsOnboarding: !profileComplete,
      needsPhoneVerification,
      onboarding: {
        complete: profileComplete,
        missingFields,
      },
    };
  }

  async validateUser(identifier: string, password: string): Promise<User | null> {
    const normalizedIdentifier = this.normalizeLoginIdentifier(identifier);
    const where = normalizedIdentifier.includes('@')
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

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken, userId: user.id };
  }

  private async handleFailedLogin(user: User) {
    const attempts = user.failedLoginAttempts + 1;
    const update: Partial<User> = { failedLoginAttempts: attempts };
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      update.failedLoginAttempts = 0;
    }
    await this.userRepo.update(user.id, update);
  }

  private generateReferralCode(): string {
    return Math.random().toString(36).slice(2, 9).toUpperCase();
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    return phoneNumber.trim().replace(/[^\d+]/g, '');
  }

  private normalizeLoginIdentifier(identifier: string): string {
    const trimmed = identifier.trim();
    return trimmed.includes('@') ? this.normalizeEmail(trimmed) : this.normalizePhoneNumber(trimmed);
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
    if (!profile.firstName) missing.push('firstName');
    if (!profile.lastName) missing.push('lastName');
    if (!profile.email) missing.push('email');
    if (!profile.phoneNumber) missing.push('phoneNumber');
    if (!profile.termsAccepted) missing.push('acceptTerms');
    if (!profile.privacyAccepted) missing.push('acceptPrivacy');
    return missing;
  }

  private isVerifiedClerkEmail(clerkUser: any, email: string): boolean {
    const emailRecord = clerkUser.emailAddresses?.find((entry: any) => entry.emailAddress === email);
    return emailRecord?.verification?.status === 'verified';
  }

  private isVerifiedClerkPhone(clerkUser: any, phoneNumber?: string): boolean {
    if (!phoneNumber) return false;
    const phoneRecord = clerkUser.phoneNumbers?.find(
      (entry: any) => this.normalizePhoneNumber(entry.phoneNumber ?? '') === phoneNumber,
    );
    return phoneRecord?.verification?.status === 'verified';
  }
}
