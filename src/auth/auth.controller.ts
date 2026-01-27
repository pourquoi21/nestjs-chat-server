import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // 상세 주소: /auth/login
  async login(@Body() body) {
    // 1. 아이디/비번이 맞는지 확인 (아까 만든 validateUser 호출)
    const validUser = await this.authService.validateUser(
      body.email,
      body.password
    );

    // 2. 틀렸으면 401 에러 던지기 ("너 누구야?")
    if (!validUser) {
      throw new UnauthorizedException('이메일이나 비밀번호가 틀렸습니다.');
    }

    // 3. 맞으면 토큰 발급해서 주기!
    return this.authService.login(validUser);
  }
}
