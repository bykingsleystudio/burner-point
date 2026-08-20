import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('auth_sessions')
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'refresh_token_hash', unique: true })
  refreshTokenHash: string;

  @Column({ name: 'device_name', nullable: true })
  deviceName: string | null;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent: string | null;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'last_used_at', nullable: true, type: 'timestamp' })
  lastUsedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', nullable: true, type: 'timestamp' })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('passkey_credentials')
export class PasskeyCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'credential_id', unique: true })
  credentialId: string;

  @Column({ name: 'public_key', type: 'bytea' })
  publicKey: Buffer;

  @Column({ type: 'bigint', default: 0 })
  counter: number;

  @Column({ type: 'jsonb', default: [] })
  transports: string[];

  @Column({ name: 'device_type', nullable: true })
  deviceType: string | null;

  @Column({ name: 'backed_up', default: false })
  backedUp: boolean;

  @Column({ nullable: true })
  name: string | null;

  @Column({ name: 'last_used_at', nullable: true, type: 'timestamp' })
  lastUsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('auth_challenges')
export class AuthChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string | null;

  @Column({ unique: true })
  challenge: string;

  @Column({ type: 'varchar', length: 32 })
  type: 'registration' | 'authentication';

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', nullable: true, type: 'timestamp' })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('oauth_clients')
export class OAuthClient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', unique: true })
  clientId: string;

  @Column({ name: 'client_secret_hash' })
  clientSecretHash: string;

  @Column({ name: 'client_name' })
  clientName: string;

  @Column({ type: 'jsonb', default: [] })
  redirectUris: string[];

  @Column({ type: 'jsonb', default: ['openid', 'profile', 'email'] })
  allowedScopes: string[];

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('oauth_authorization_codes')
export class OAuthAuthorizationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'code_hash', unique: true })
  codeHash: string;

  @Column({ name: 'client_id' })
  @Index()
  clientId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  redirectUri: string;

  @Column({ type: 'jsonb', default: [] })
  scopes: string[];

  @Column({ nullable: true })
  nonce: string | null;

  @Column({ name: 'code_challenge', nullable: true })
  codeChallenge: string | null;

  @Column({ name: 'code_challenge_method', nullable: true })
  codeChallengeMethod: string | null;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', nullable: true, type: 'timestamp' })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
