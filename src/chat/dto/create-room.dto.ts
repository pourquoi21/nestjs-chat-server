import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsOptional() // 제목이 필수가 아님
  title?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  invitedUserIds: number[];
}
