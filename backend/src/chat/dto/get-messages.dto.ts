import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20; // 기본값

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number; // 마지막으로 본 메시지의 ID를 넣어줌 (없으면 최신부터)
}
