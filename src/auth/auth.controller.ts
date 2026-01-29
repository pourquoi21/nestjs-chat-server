import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // 상세 주소: /auth/login
  async login(@Body() loginDto: LoginDto) {
    // 아이디/비번이 맞는지 확인 (validateUser 호출)
    const validUser = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    // 틀렸으면 401 에러
    if (!validUser) {
      throw new UnauthorizedException('이메일이나 비밀번호가 틀렸습니다.');
    }

    // 맞으면 토큰 발급해서 주기
    return this.authService.login(validUser);
  }
}
