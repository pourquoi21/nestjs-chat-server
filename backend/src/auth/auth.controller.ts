import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') // 상세 주소: /auth/login
  @ApiOperation({
    summary: '로그인',
    description: '이메일과 비밀번호로 로그인하여 Access Token을 발급받습니다.'
  })
  @ApiBody({ type: LoginDto }) // Swagger에 "Body에 뭐 넣어야 해?" 알려줌
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: { accessToken: 'eyJhbGciOiJIUz...' }
    },
  })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 불일치' })
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
