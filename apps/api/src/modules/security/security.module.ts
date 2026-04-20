import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../../database/entities/extended-entities';
import { SecurityAuditService } from './security-audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [SecurityAuditService],
  exports: [SecurityAuditService],
})
export class SecurityModule {}
