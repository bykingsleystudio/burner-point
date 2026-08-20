import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthChallenge, OAuthAuthorizationCode, OAuthClient, PasskeyCredential } from '../../database/entities/auth-security.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AuthSecurityService {
  constructor(
    @InjectRepository(AuthChallenge) private readonly challengeRepo: Repository<AuthChallenge>,
    @InjectRepository(PasskeyCredential) private readonly credentialRepo: Repository<PasskeyCredential>,
    @InjectRepository(OAuthClient) private readonly oauthClientRepo: Repository<OAuthClient>,
    @InjectRepository(OAuthAuthorizationCode) private readonly oauthCodeRepo: Repository<OAuthAuthorizationCode>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async registrationOptions(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const credentials = await this.credentialRepo.find({ where: { userId } });
    const options = await generateRegistrationOptions({
      rpName: this.rpName(),
      rpID: this.rpId(),
      userName: user.email || user.phoneNumber || userId,
      userDisplayName: user.fullName || user.email || userId,
      userID: new TextEncoder().encode(userId),
      attestationType: 'none',
      excludeCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: credential.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    await this.saveChallenge(userId, 'registration', options.challenge);
    return options;
  }

  async verifyRegistration(userId: string, response: Record<string, unknown>, name?: string) {
    const challenge = await this.latestUserChallenge(userId, 'registration');
    const verification = await verifyRegistrationResponse({
      response: response as any,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.origin(),
      expectedRPID: this.rpId(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Passkey registration could not be verified');
    }

    const registration = verification.registrationInfo as any;
    const credential = registration.credential ?? registration;
    await this.credentialRepo.save(this.credentialRepo.create({
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: Number(credential.counter ?? 0),
      transports: credential.transports ?? [],
      deviceType: registration.credentialDeviceType ?? null,
      backedUp: Boolean(registration.credentialBackedUp),
      name: name?.trim() || 'Passkey',
    }));
    await this.challengeRepo.update(challenge.id, { consumedAt: new Date() });

    return { registered: true };
  }

  async authenticationOptions() {
    const options = await generateAuthenticationOptions({
      rpID: this.rpId(),
      userVerification: 'preferred',
    });
    await this.saveChallenge(null, 'authentication', options.challenge);
    return options;
  }

  async verifyAuthentication(response: Record<string, unknown>) {
    const credentialId = typeof response.id === 'string' ? response.id : '';
    if (!credentialId) throw new BadRequestException('Passkey credential id is required');

    const credential = await this.credentialRepo.findOne({ where: { credentialId } });
    if (!credential) throw new UnauthorizedException('Passkey not recognized');

    const challenge = await this.latestChallenge('authentication');
    const verification = await verifyAuthenticationResponse({
      response: response as any,
      expectedChallenge: challenge.challenge,
      expectedOrigin: this.origin(),
      expectedRPID: this.rpId(),
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: Number(credential.counter),
        transports: credential.transports as any,
      },
    });

    if (!verification.verified) throw new UnauthorizedException('Passkey authentication failed');

    credential.counter = verification.authenticationInfo.newCounter;
    credential.lastUsedAt = new Date();
    await this.credentialRepo.save(credential);
    await this.challengeRepo.update(challenge.id, { consumedAt: new Date() });
    return { userId: credential.userId };
  }

  async listPasskeys(userId: string) {
    const credentials = await this.credentialRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return credentials.map((credential) => ({
      id: credential.id,
      name: credential.name,
      deviceType: credential.deviceType,
      backedUp: credential.backedUp,
      lastUsedAt: credential.lastUsedAt,
      createdAt: credential.createdAt,
    }));
  }

  async removePasskey(userId: string, id: string) {
    const result = await this.credentialRepo.delete({ id, userId });
    if (!result.affected) throw new BadRequestException('Passkey not found');
    return { success: true };
  }

  oauthDiscovery(apiOrigin: string) {
    const issuer = this.config.get<string>('OAUTH_ISSUER') || `${apiOrigin.replace(/\/+$/, '')}/api/oauth`;
    return {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['profile', 'email'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
    };
  }

  async registerOAuthClient(input: { name: string; redirectUris: string[]; scopes?: string[] }) {
    if (!input.name?.trim() || !input.redirectUris?.length) {
      throw new BadRequestException('Client name and at least one redirect URI are required');
    }
    for (const redirectUri of input.redirectUris) {
      const url = new URL(redirectUri);
      if (!['https:', 'http:'].includes(url.protocol) || url.protocol === 'http:' && url.hostname !== 'localhost') {
        throw new BadRequestException('Redirect URIs must use HTTPS except for localhost development');
      }
    }

    const clientId = `bp_${randomBytes(18).toString('base64url')}`;
    const clientSecret = randomBytes(32).toString('base64url');
    const client = await this.oauthClientRepo.save(this.oauthClientRepo.create({
      clientId,
      clientSecretHash: await bcrypt.hash(clientSecret, 12),
      clientName: input.name.trim(),
      redirectUris: input.redirectUris,
      allowedScopes: input.scopes?.length ? input.scopes : ['openid', 'profile', 'email'],
      enabled: true,
    }));
    return { clientId: client.clientId, clientSecret, redirectUris: client.redirectUris, scopes: client.allowedScopes };
  }

  async createAuthorizationCode(input: {
    userId: string;
    clientId: string;
    redirectUri: string;
    scope?: string;
    nonce?: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }) {
    const client = await this.oauthClientRepo.findOne({ where: { clientId: input.clientId, enabled: true } });
    if (!client || !client.redirectUris.includes(input.redirectUri)) {
      throw new BadRequestException('OAuth client or redirect URI is not registered');
    }
    const scopes = (input.scope || 'openid profile email').split(/\s+/).filter(Boolean);
    if (scopes.some((scope) => !client.allowedScopes.includes(scope))) {
      throw new BadRequestException('Requested OAuth scope is not allowed for this client');
    }
    if (input.codeChallengeMethod && input.codeChallengeMethod !== 'S256') {
      throw new BadRequestException('Only S256 PKCE is supported');
    }

    const code = randomBytes(32).toString('base64url');
    await this.oauthCodeRepo.save(this.oauthCodeRepo.create({
      codeHash: this.hashCode(code),
      clientId: input.clientId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      scopes,
      nonce: input.nonce || null,
      codeChallenge: input.codeChallenge || null,
      codeChallengeMethod: input.codeChallengeMethod || null,
      expiresAt: new Date(Date.now() + 60 * 1000),
    }));
    return { code, redirectUri: input.redirectUri };
  }

  async exchangeAuthorizationCode(input: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    codeVerifier?: string;
  }) {
    const client = await this.oauthClientRepo.findOne({ where: { clientId: input.clientId, enabled: true } });
    if (!client || !(await bcrypt.compare(input.clientSecret, client.clientSecretHash))) {
      throw new UnauthorizedException('Invalid OAuth client credentials');
    }
    const record = await this.oauthCodeRepo.findOne({ where: { codeHash: this.hashCode(input.code), clientId: input.clientId } });
    if (!record || record.consumedAt || record.expiresAt <= new Date() || record.redirectUri !== input.redirectUri) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }
    if (record.codeChallenge) {
      if (!input.codeVerifier || this.pkceChallenge(input.codeVerifier) !== record.codeChallenge) {
        throw new UnauthorizedException('Invalid PKCE verifier');
      }
    }
    record.consumedAt = new Date();
    await this.oauthCodeRepo.save(record);
    return { userId: record.userId, scopes: record.scopes, nonce: record.nonce };
  }

  private async saveChallenge(userId: string | null, type: 'registration' | 'authentication', challenge: string) {
    await this.challengeRepo.delete({ type });
    await this.challengeRepo.save(this.challengeRepo.create({
      userId,
      type,
      challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    }));
  }

  private async latestChallenge(type: 'registration' | 'authentication') {
    const challenge = await this.challengeRepo.findOne({
      where: { type },
      order: { createdAt: 'DESC' },
    });
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
      throw new UnauthorizedException('Passkey challenge expired');
    }
    return challenge;
  }

  private async latestUserChallenge(userId: string, type: 'registration' | 'authentication') {
    const challenge = await this.challengeRepo.findOne({
      where: { userId, type },
      order: { createdAt: 'DESC' },
    });
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date()) {
      throw new UnauthorizedException('Passkey challenge expired');
    }
    return challenge;
  }

  private rpName() {
    return this.config.get<string>('WEBAUTHN_RP_NAME') || 'Burner Point';
  }

  private hashCode(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private pkceChallenge(verifier: string) {
    return createHash('sha256').update(verifier).digest('base64url');
  }

  private rpId() {
    const configured = this.config.get<string>('WEBAUTHN_RP_ID');
    if (configured) return configured;
    return new URL(this.origin()).hostname;
  }

  private origin() {
    return this.config.get<string>('WEBAUTHN_ORIGIN') || this.config.get<string>('APP_URL') || 'https://burnerpoint.com';
  }
}
