import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { resolveJwtAccessSecret } from '../../config/runtime-env';

function buildGatewayCors() {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true';

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');
      const isExplicitlyAllowed = allowedOrigins.includes(normalizedOrigin);
      const isVercelPreview =
        allowVercelPreviews &&
        /^https:\/\/[a-z0-9-]+-vercel\.app$/i.test(new URL(normalizedOrigin).hostname);

      if (isExplicitlyAllowed || isVercelPreview) {
        callback(null, true);
        return;
      }

      callback(new Error('Socket origin not allowed'));
    },
    credentials: true,
  };
}

@WebSocketGateway({
  cors: buildGatewayCors(),
  namespace: '/realtime',
})
export class BurnerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(BurnerGateway.name);
  // Map of userId -> Set of socketIds
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, { secret: resolveJwtAccessSecret(this.configService) });
      client.data.userId = payload.sub;

      if (!this.userSockets.has(payload.sub)) this.userSockets.set(payload.sub, new Set());
      this.userSockets.get(payload.sub).add(client.id);

      client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  @SubscribeMessage('subscribe_number')
  handleSubscribeNumber(@ConnectedSocket() _client: Socket, @MessageBody() _data: { numberId: string }) {
    return {
      subscribed: false,
      message: 'Number-room subscriptions are disabled on this gateway surface.',
    };
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong', timestamp: Date.now() };
  }
}
