// src/chat/redis-io.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger('RedisIoAdapter');

  async connectToRedis(): Promise<void> {
    this.logger.log('[Redis] 서버 연결 시도 중... (url: redis://localhost:6379)');

    // Pub(방송하는 사람)과 Sub(듣는 사람) 클라이언트를 각각 만듦
    const pubClient = createClient({
      url: 'redis://localhost:6379',
    });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => this.logger.error(`[Redis] Pub Client 에러: ${err.message}`));
    subClient.on('error', (err) => this.logger.error(`[Redis] Sub Client 에러: ${err.message}`));

    try {
      // Redis에 실제 연결 시도
      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.logger.log('[Redis] Pub/Sub 클라이언트 연결 성공!');

      // 어댑터 생성
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch (error) {
      this.logger.error('[Redis] 연결 실패!');
      throw error;
    }
    
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options) as Server;

    this.logger.log(`[Redis] Socket.io서버에 Redis 어댑터 결합 (Port: ${port})`)

    // 소켓 서버에 Redis 어댑터 장착
    server.adapter(this.adapterConstructor);
    return server;
  }
}
