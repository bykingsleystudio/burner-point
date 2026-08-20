import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { SupabaseAuthService } from './supabase-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User } from '../../database/entities/user.entity';
import { AuthSession } from '../../database/entities/auth-security.entity';
import { AuthChallenge, OAuthAuthorizationCode, OAuthClient, PasskeyCredential } from '../../database/entities/auth-security.entity';
import { AuthSecurityController, OAuthController, PasskeyAuthenticationController } from './auth-security.controller';
import { AuthSecurityService } from './auth-security.service';
import { RolesGuard } from './guards/roles.guard';
import { RedisService } from '../global/redis.service';
import { resolveJwtAccessSecret } from '../../config/runtime-env';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthSession, AuthChallenge, PasskeyCredential, OAuthClient, OAuthAuthorizationCode]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: resolveJwtAccessSecret(cfg),
        signOptions: { expiresIn: cfg.get('JWT_ACCESS_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [AuthController, AuthSecurityController, PasskeyAuthenticationController, OAuthController],
  providers: [SupabaseAuthService, AuthSecurityService, JwtStrategy, RedisService, RolesGuard],
  exports: [SupabaseAuthService, JwtModule],
})
export class AuthModule {}
