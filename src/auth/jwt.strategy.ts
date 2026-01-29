import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 헤더의 Bearer 토큰을 가져옴
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 토큰 만들 때 썼던 비밀키랑 똑같이
      // (실무에선 ConfigService로 환경변수 가져오지만, 지금은 하드코딩으로)
      secretOrKey: 'secretKey', // TODO: AuthModule에 등록한 secret과 일치
    });
  }

  // 토큰 검증이 성공하면 이 함수가 실행됨
  // payload: 토큰을 깠을 때 나온 JSON 내용
  validate(payload: JwtPayload) {
    // 여기서 리턴한 값이 req.user에 들어감
    return { sub: payload.sub, email: payload.email };
  }
}
