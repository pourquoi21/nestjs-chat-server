import { IsArray, IsInt } from 'class-validator';

export class InviteMembersDto {
  @IsArray()
  @IsInt({ each: true })
  invitedUserIds: number[] = [];
}