import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetMessagesDto {
  @ApiProperty({
    description: '가져올 메시지의 수',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20; // 기본값

  @ApiProperty({
    description: '마지막으로 본 메시지 ID',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;
}
