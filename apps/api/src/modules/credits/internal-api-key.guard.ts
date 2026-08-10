import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = String(
      request.headers['x-internal-api-key']
      || request.headers['x-api-key']
      || '',
    ).trim();
    const configuredKey = String(this.configService.get<string>('INTERNAL_API_KEY') || '').trim();

    if (!configuredKey || headerKey !== configuredKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
