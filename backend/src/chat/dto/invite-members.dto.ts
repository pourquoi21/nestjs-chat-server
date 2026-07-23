import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMembersDto {
  @ApiProperty({
    description: '초대할 멤버들의 id',
    example: [1, 2],
  })
  @IsArray()
  @IsInt({ each: true })
  invitedUserIds: number[] = [];
}