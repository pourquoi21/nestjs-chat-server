import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 로그인 시 아이디/비번 맞는지 확인하는 함수
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user; // 보안을 위해 비번은 빼고 리턴
      return result;
    }
    return null;
  }

  // 진짜 토큰 발급해주는 함수
  async login(user: any) {
    const payload = { email: user.email, sub: user.id }; // 토큰에 담을 정보
    return {
      // 👇 signAsync를 쓰면 "await가 없는데 왜 async냐"는 에러 해결!
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}