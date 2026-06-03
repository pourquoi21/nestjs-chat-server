// src/chat/redis-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    // Pub(방송하는 사람)과 Sub(듣는 사람) 클라이언트를 각각 만듦
    const pubClient = createClient({
      url: 'redis://localhost:6379',
    });
    const subClient = pubClient.duplicate();

    // Redis에 실제 연결 시도
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // 어댑터 생성
    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options) as Server;
    // 소켓 서버에 Redis 어댑터 장착
    server.adapter(this.adapterConstructor);
    return server;
  }
}
