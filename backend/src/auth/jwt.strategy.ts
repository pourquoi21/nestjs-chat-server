import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // 헤더의 Bearer 토큰을 가져옴
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 토큰 만들 때 썼던 비밀키랑 똑같이
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  // 토큰 검증이 성공하면 이 함수가 실행됨
  // payload: 토큰을 깠을 때 나온 JSON 내용
  validate(payload: JwtPayload) {
    // 여기서 리턴한 값이 req.user에 들어감
    return { sub: payload.sub
    //  , email: payload.email
    };
  }
}
