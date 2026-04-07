import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbuseService } from './abuse.service';
import { AbuseController } from './abuse.controller';
import { AbuseEvent, VelocityCounter } from '../../database/entities/extended-entities';

@Module({
  imports: [TypeOrmModule.forFeature([AbuseEvent, VelocityCounter])],
  controllers: [AbuseController],
  providers: [AbuseService],
  exports: [AbuseService],
})
export class AbuseModule {}
