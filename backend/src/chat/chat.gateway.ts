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
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ParseIntPipe, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: SocketUser;
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

interface SocketUser {
  sub: number;
  email: string;
  nickname: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'chat',
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // 소켓 서버 객체 (전체 공지용)

  // JwtService 주입받기
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  // 연결할때 토큰확인
  async handleConnection(client: AuthenticatedSocket) {
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

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new Error('User not found');
      }

      // 소켓 객체에 유저 정보 저장
      // 구조분해 할당으로 하지 않은 이유: nickname 끼워넣기
      client.data.user = {
        sub: payload.sub,
        email: payload.email,
        nickname: user.nickname,
      };
      console.log(client.data.user);
      console.log(`[인증 성공] 유저: ${payload.email}, 소켓ID: ${client.id}`);
      client.emit('ready');
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

  // 방에 들어가기
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(ParseIntPipe) room: number, // 방 번호
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      console.log('[client] ', client);
      // 이미 멤버인지만 확인
      const isMember = await this.chatService.isRoomMember(room, user.sub);

      if (!isMember) {
        // client.emit('exception', '먼저 방에 참여해야 합니다.');
        return { status: 'error', message: '먼저 방에 참여해야 합니다.' };
      }

      // 통과했다면 socket 작업
      client.join(`${room}`);
      console.log(
        `[입장] ${client.data.user?.email} 님이 ${room}번방 소켓에 연결됨`,
      );

      client.to(`${room}`).emit('notice', `${user.email}님이 입장하셨습니다`);
      return {
        status: 'success',
        message: `${room}번 방에 입장 완료`,
        data: { room, user: user.email },
      };
    } catch (e) {
      console.error('Join Room Error: ', e);
      return { status: 'error', message: '서버 내부 오류 발생' };
    }
  }

  // 방으로 입장해서 메시지 보내기
  @SubscribeMessage('message')
  async handleMessage(
    // @MessageBody() data: string,
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: any; msg: string;
    //  temporaryId: number 
    },
  ) {
    try {
      console.log('came into gateway', data);
      const { msg
      //  , temporaryId 
      } = data;
      const room = parseInt(String(data.room), 10);

      // 메시지 프론트 렌더링용 변수
      const userUid = client.data.user?.sub;
      // const userEmail = client.data.user?.email;
      const user = client.data?.user;
      const userNickname = client.data.user?.nickname;

      console.log('user data: ', client.data.user);

      if (!user || !room) {
        console.error('error: no data');
        return;
      }

      try {
        console.log(room);
        const isMember = await this.chatService.isRoomMember(room, user.sub);

        if (!isMember) {
          client.emit(
            'exception',
            '해당 방의 멤버가 아니므로 메시지를 보낼 수 없습니다.',
          );
          return { status: 'error', message: '해당 방의 멤버가 아닙니다.' };
        }
        // DB에 저장 (비동기)
        const savedMessage = await this.chatService.saveMessage(room, user.sub, msg);
        // 수정
        // this.chatService.saveMessage(room, user.sub, msg)
        //  .then((savedMessage) => {
            // DB저장 실패하면 로그남기기
        //    console.error(`[DB 저장 에러] 방: ${room}, 유저: ${userUid}, ${userNickname}, 에러: `, err);
        //  })
        //  .catch((err) => {
        //    console.error(`[DB 저장 에러] 에러: `, err);
        //  })
        
        // this.server.emit('message', {
        //   id: savedMessage.id,
        //   // temporaryId: temporaryId,
        //   content: msg,
        //   user: {
        //     id: userUid,
        //     nickname: userNickname,
        //   },
        //   created_at: savedMessage.created_at || new Date(),
        //   tmpTime: new Date(savedMessage.created_at).getTime(),
        // });

        // 해당 방에 방송
        this.server.to(`${room}`).emit('message', {
          id: savedMessage.id,
          // temporaryId: temporaryId,
          content: msg,
          user: {
            id: userUid,
            nickname: userNickname,
          },
          created_at: savedMessage.created_at || new Date(),
          tmpTime: new Date(savedMessage.created_at).getTime(),
        });
      } catch (error) {
        console.error('메시지 전송 중 에러: ', error);
        client.emit('exception', '메시지 전송 실패');
        return { status: 'error', message: '서버 내부 오류 발생' };
      }

    } catch (error) {
      console.log('error in gateway', error);
    }
    
  }

  // 방 나가기
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody(ParseIntPipe) room: number,
  ) {
    client.leave(room.toString());
    client.to(room.toString()).emit('notice', `${client.id}님이 나갔습니다.`);
  }
}
