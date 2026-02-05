import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({
    description: '비밀번호 (4자 이상)',
    example: 'password123',
    minLength: 4,
  })
  @IsString()
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({
    description: '닉네임',
    example: '홍길동',
  })
  @IsString()
  nickname: string;
}
