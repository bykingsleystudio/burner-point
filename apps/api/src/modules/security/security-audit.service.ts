import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/extended-entities';

export interface SecurityAuditEvent {
  userId?: string;
  workspaceId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

const REDACTED_KEYS = [
  'authorization',
  'cookie',
  'password',
  'token',
  'secret',
  'api_key',
  'apikey',
  'private_key',
  'privatekey',
  'refresh',
  'session',
  'otp',
  'code',
  'ssn',
  'license',
  'document',
];

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(@InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>) {}

  async record(event: SecurityAuditEvent): Promise<void> {
    try {
      await this.auditRepo.save(
        this.auditRepo.create({
          userId: event.userId || 'anonymous',
          workspaceId: event.workspaceId,
          action: event.action.slice(0, 120),
          resource: event.resource.slice(0, 120),
          resourceId: event.resourceId,
          oldValue: this.redact(event.oldValue || {}),
          newValue: this.redact(event.newValue || {}),
          ipAddress: event.ipAddress,
          userAgent: event.userAgent?.slice(0, 500),
        }),
      );
    } catch (error) {
      this.logger.warn(`Security audit write failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  redact(value: unknown): Record<string, unknown> {
    const redacted = this.redactValue(value);
    return redacted && typeof redacted === 'object' && !Array.isArray(redacted)
      ? redacted as Record<string, unknown>
      : { value: redacted };
  }

  private redactValue(value: unknown): unknown {
    if (Array.isArray(value)) return value.slice(0, 50).map((item) => this.redactValue(item));
    if (!value || typeof value !== 'object') {
      if (typeof value === 'string' && value.length > 500) return `${value.slice(0, 500)}...[truncated]`;
      return value;
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nested]) => {
      const normalized = key.toLowerCase().replace(/[-\s]/g, '_');
      if (REDACTED_KEYS.some((blocked) => normalized.includes(blocked))) {
        acc[key] = '[redacted]';
      } else {
        acc[key] = this.redactValue(nested);
      }
      return acc;
    }, {});
  }
}
