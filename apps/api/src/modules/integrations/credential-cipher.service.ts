import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { resolveConfiguredEnv } from '../../config/runtime-env';

/**
 * Encrypts provider-issued secrets before persistence. The API never returns
 * the ciphertext or plaintext through public order APIs.
 */
@Injectable()
export class CredentialCipherService {
  private static readonly AAD = Buffer.from('burner-point:connectivity:v1', 'utf8');

  constructor(private readonly config: ConfigService) {}

  encrypt(value: unknown): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(CredentialCipherService.AAD);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return `v1:${iv.toString('base64url')}:${authTag.toString('base64url')}:${ciphertext.toString('base64url')}`;
  }

  private getKey(): Buffer {
    const configured = resolveConfiguredEnv('ENCRYPTION_KEY', this.config);
    if (!configured) {
      throw new InternalServerErrorException('ENCRYPTION_KEY is required before provider credentials can be persisted');
    }

    const hex = /^[a-f0-9]{64}$/i.test(configured) ? Buffer.from(configured, 'hex') : null;
    if (hex?.length === 32) return hex;

    const base64 = Buffer.from(configured, 'base64');
    if (base64.length === 32 && base64.toString('base64').replace(/=+$/, '') === configured.replace(/=+$/, '')) {
      return base64;
    }

    if (configured.length < 32) {
      throw new InternalServerErrorException('ENCRYPTION_KEY must be a 32-byte base64 value, 64-character hex value, or a high-entropy secret of at least 32 characters');
    }

    return createHash('sha256').update(configured, 'utf8').digest();
  }
}
