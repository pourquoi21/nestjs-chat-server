import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

// @WebSocketGateway({ cors: { origin: '*' } })
// cors 설정을 해줘야 나중에 프론트엔드에서 접속 막히는 걸 방지
@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // 소켓 서버 객체 (전체 공지용)

  // JwtService 주입받기
  constructor(private readonly jwtService: JwtService) {}

  // 연결할때 토큰확인
  async handleConnection(client: Socket) {
    console.log(`[연결 시도] 클라이언트 ID: ${client.id}`);

    // 헤더에서 토큰 꺼내기
    const authHeader = client.handshake.headers['authorization'];
    if (!authHeader) {
      console.log('[에러] 토큰이 없습니다.');
      client.disconnect();
      return;
    }
    try {
      const token = authHeader.split(' ')[1]; // Bearer 떼어내기
      const payload = await this.jwtService.verify(token, {
        secret: 'secretKey',
      });

      client.data.user = payload; // 소켓 객체에 유저 정보 저장
      console.log(`[인증 성공] 유저: ${payload.email}, 소켓ID: ${client.id}`);
    } catch (error) {
      console.log('[에러] 유효하지 않은 토큰');
      client.disconnect();
    }
  }

  // 2. 손님이 나갔을 때 (연결 끊김)
  handleDisconnect(client: Socket) {
    console.log(`[종료됨] 클라이언트 ID: ${client.id}`);
  }

  // 3. 손님이 'message'라는 제목으로 말을 걸었을 때
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`받은 메시지: ${data} (from ${client.id})`);

    // 서버가 다시 답장 보내기 (emit)
    // client.emit('message', `네 말 잘 들었어: ${data}`); // 1:1 답장
    this.server.emit('message', `[전체공지] ${client.id}님이 말함: ${data}`); // 전체 방송

    return '서버가 잘 받음';
  }
}
