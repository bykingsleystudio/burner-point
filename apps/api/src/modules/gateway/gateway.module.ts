import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { resolveJwtAccessSecret } from '../../config/runtime-env';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: resolveJwtAccessSecret(configService),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
        },
      }),
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway, JwtModule],
})
export class GatewayModule {}
