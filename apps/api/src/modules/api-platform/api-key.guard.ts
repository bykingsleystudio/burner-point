import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { resolveJwtAccessSecret } from '../../config/runtime-env';
import { ApiPlatformService } from './api-platform.service';
import { API_SCOPES_METADATA_KEY } from './api-scopes.decorator';

type ApiRequestUser = {
  id: string;
  role?: string;
  authType: 'jwt' | 'api_key';
  apiKeyId?: string;
  apiKeyScopes?: string[];
};

@Injectable()
export class ApiKeyOrJwtGuard implements CanActivate {
  constructor(
    private readonly apiPlatformService: ApiPlatformService,
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = String(request.headers?.authorization ?? '');
    if (authorization.startsWith('Bearer ')) {
      try {
        const payload = this.jwtService.verify<{ sub?: string; role?: string }>(authorization.slice(7), {
          secret: resolveJwtAccessSecret(this.configService),
        });
        if (!payload.sub) throw new Error('JWT missing subject');
        request.user = { id: payload.sub, role: payload.role, authType: 'jwt' } satisfies ApiRequestUser;
        return true;
      } catch {
        throw new ForbiddenException('Invalid access token');
      }
    }

    const rawKey = request.headers?.['x-api-key'];
    if (typeof rawKey !== 'string' || !rawKey.startsWith('bp_')) {
      throw new ForbiddenException('A bearer token or Burner Point API key is required');
    }
    const key = await this.apiPlatformService.validateApiKey(rawKey);
    if (!key) throw new ForbiddenException('Invalid or revoked API key');
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(API_SCOPES_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];
    if (!this.hasScopes(key.scopes ?? [], requiredScopes)) {
      throw new ForbiddenException('API key does not have the required scope');
    }
    request.user = {
      id: key.userId,
      authType: 'api_key',
      apiKeyId: key.id,
      apiKeyScopes: key.scopes ?? [],
    } satisfies ApiRequestUser;
    return true;
  }

  private hasScopes(granted: string[], required: string[]): boolean {
    if (!required.length || granted.includes('*')) return true;
    return required.every((scope) => {
      if (granted.includes(scope)) return true;
      const action = scope.split(':')[1];
      return Boolean(action && granted.includes(action));
    });
  }
}
