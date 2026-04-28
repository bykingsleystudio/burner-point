import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from '../../database/entities/extended-entities';
import { MessagingModule } from '../messaging/messaging.module';
import { UsersModule } from '../users/users.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket]), UsersModule, MessagingModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
