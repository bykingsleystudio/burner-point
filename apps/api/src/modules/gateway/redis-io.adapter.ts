import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, ServerOptions } from 'socket.io';
import { RedisService } from '../global/redis.service';

/** Shares Socket.IO rooms and broadcasts across all API instances through Redis. */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(
    app: INestApplicationContext,
    private readonly redisService: RedisService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;
    const clients = this.redisService.createSocketIoClients();

    if (!clients) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('REDIS_URL is required for horizontally safe Socket.IO in production');
      }
      this.logger.warn('Socket.IO is using local-only rooms because Redis is not configured');
      return server;
    }

    server.adapter(createAdapter(clients.pubClient, clients.subClient));
    return server;
  }
}
