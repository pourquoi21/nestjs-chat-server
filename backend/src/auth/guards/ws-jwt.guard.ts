import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const client: Socket = context.switchToWs().getClient();
            const rawToken = client.handshake.auth?.token;

            if (!rawToken) {
                throw new WsException('[에러] 토큰이 없습니다.');
            }

            const token = rawToken.startsWith('Bearer ') ? rawToken.split(' ')[1] : rawToken;
            const payload = this.jwtService.verify(token, {
                secret: 'secretKey',
            });

            client.data.user = payload;

            return true;
        } catch (err) {
            throw new WsException('[에러] 인증되지 않은 소켓 접근');
        }
    }
}
