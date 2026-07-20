import { IsEmail, IsInt, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RoomMemberDto {
  @ApiProperty()
  @IsInt()
  id!: number;

  @ApiProperty({
  description: '이메일 주소',
  example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @ApiProperty({
  description: '닉네임',
  example: '홍길동',
  })
  @IsString()
  nickname!: string;
}
