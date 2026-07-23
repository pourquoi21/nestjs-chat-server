import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({
      description: '방제목',
      example: '테스트방',
    })
  @IsString()
  @IsOptional() // 제목이 필수가 아님
  title?: string;
}
