import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: JwtPayload;
  };

  handshake: Socket['handshake'] & {
    auth: {
      token?: string;
    };
    headers: {
      authorization?: string;
    };
  };
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // 소켓 서버 객체 (전체 공지용)

  // JwtService 주입받기
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  // 연결할때 토큰확인
  handleConnection(client: AuthenticatedSocket) {
    console.log(`[연결 시도] 클라이언트 ID: ${client.id}`);

    const rawToken =
      client.handshake.auth.token || client.handshake.headers['authorization'];

    // 헤더에서 토큰 꺼내기
    if (!rawToken) {
      console.log('[에러] 토큰이 없습니다.');
      client.disconnect();
      return;
    }
    const token = rawToken.split(' ')[1]; // Bearer 떼어내기

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: 'secretKey',
      });

      client.data.user = payload; // 소켓 객체에 유저 정보 저장
      console.log(`[인증 성공] 유저: ${payload.email}, 소켓ID: ${client.id}`);
    } catch (error) {
      console.log(
        '[에러] 유효하지 않은 토큰: ',
        error instanceof Error ? error.message : error,
      );
      client.disconnect();
    }
  }

  // 손님이 나갔을 때 (연결 끊김)
  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`[종료됨] 클라이언트 ID: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: number, // 방 번호
  ) {
    const user = client.data.user;
    if (!user) return;

    // DB 작업
    try {
      await this.chatService.joinRoom(room, user.sub);
    } catch (error) {
      console.log(
        `DB 멤버 추가 중: `,
        error instanceof Error ? error.message : error,
      );
    }

    // socket 작업
    client.join(`${room}`);
    console.log(
      `[입장] ${client.data.user?.email} 님이 ${room}번방 소켓에 연결됨`,
    );

    client.to(`${room}`).emit('notice', `${user.email}님이 입장하셨습니다`);

    return `${room}번 방에 입장 완료`;
  }

  // 방으로 입장해서 메시지 보내기
  @SubscribeMessage('message')
  async handleMessage(
    // @MessageBody() data: string,
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: number; msg: string },
  ) {
    const { room, msg } = data;
    const userEmail = client.data.user?.email;
    const user = client.data.user;

    if (user) {
      // DB에 저장 (비동기)
      await this.chatService.saveMessage(room, user.sub, msg);
    }

    console.log(`[메시지] ${room}번방 - ${userEmail}:  ${msg}`);

    // 서버가 다시 답장 보내기 (emit)
    // client.emit('message', `Received: ${data}`); // 1:1 답장
    // 전체 방송
    // this.server.emit('message', `[전체공지] ${client.id}님이 말함: ${data}`); // 전체 방송

    // 특정 방에 방송
    this.server.to(`${room}`).emit('message', {
      user: userEmail,
      message: msg,
      time: new Date(),
    });
  }

  // 방 나가기
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: number,
  ) {
    client.leave(room.toString());
    client.to(room.toString()).emit('notice', `${client.id}님이 나갔습니다.`);
  }
}
