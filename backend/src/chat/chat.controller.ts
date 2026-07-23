import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUser } from '../auth/interfaces/active-user.interface';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import { RoomMemberDto } from './dto/room-member.dto';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room-entity';

@ApiTags('채팅 API')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  @ApiOperation({
    summary: '채팅방 만들기',
    description: '방 제목을 입력받아 방을 생성합니다.',
  })
  @ApiCreatedResponse({
    description: '방 생성 성공',
    type: ChatRoom,
  })
  async createRoom(
    @Req() req: { user: ActiveUser },
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return await this.chatService.createRoom(req.user, createRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:roomId/invite')
  @ApiOperation({
    summary: '유저 초대하기',
    description: '방 제목과 초대할 유저들의 ID를 입력받아 방에 초대합니다.',
  })
  @ApiCreatedResponse({
    description: '초대 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '초대 완료',
        },
      },
    },
  })
  async inviteMembers(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Req() req: { user: ActiveUser },
    @Body() inviteMembersDto: InviteMembersDto,
  ) {
    const { invitedNicknames } = await this.chatService.inviteMembers(
    // await this.chatService.inviteMembers(
    roomId,
      req.user.sub,
      inviteMembersDto);

    this.chatGateway.server.to(`${roomId}`).emit('system_message', {
      content: `${invitedNicknames.join(', ')}님이 초대되었습니다.`,
    })
    return { message: '초대 완료' };
  }

  @Get('rooms')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 채팅방 목록 가져오기' })
  @ApiCreatedResponse({ description: '성공', type: [ChatRoom] })
  async getMyRooms(@Req() req: { user: ActiveUser }): Promise<ChatRoom[]> {
    return await this.chatService.getMyRooms(req.user.sub);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({
    summary: '채팅방 메시지 가져오기',
    description: '채팅방 ID를 통해 해당 방의 메시지를 가져옵니다.',
  })
  @ApiCreatedResponse({
    description: '메시지 가져오기 성공',
    type: [ChatMessage],
  })
  async getRoomMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatMessage[]> {
    return await this.chatService.getMessages(roomId);
  }

  @Get('rooms/:roomId/members')
  @ApiOperation({
    summary: '채팅방에 참여 중인 유저 목록 조회하기',
    description: '채팅방 ID를 통해 해당 방의 유저 목록을 가져옵니다.',
  })
  @ApiCreatedResponse({
    description: '참여 중인 멤버 가져오기 성공',
    type: [RoomMemberDto],
  })
  async getRoomUsers(
    @Param('roomId', ParseIntPipe) roomId: number,
  ): Promise<RoomMemberDto[]> {
    return await this.chatService.getMembers(roomId);
  }

  @Delete('rooms/:roomId/leave')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '방에서 나가기' })
  @ApiCreatedResponse({
    description: '퇴장 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '퇴장 완료',
        },
      },
    },
  })
  async leaveRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Req() req: { user: ActiveUser },
  ) {
  
    const user = await this.chatService.leaveRoom(roomId, req.user.sub);

    this.chatGateway.server.to(`${roomId}`).emit('system_message', {
      content: `${user.nickname}님이 나갔습니다.`,
    })

    // this.chatGateway.server.to(`${roomId}`).emit('system_message', {
    //   content: `${user}`
    // })
   return { message: '퇴장 완료' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('rooms/:roomId/read')
  @ApiOperation({
    summary: '채팅 읽기',
    description: '채팅을 읽어 마지막으로 읽은 메시지를 업데이트합니다.',
  })
  @ApiCreatedResponse({
    description: '채팅 읽기',
  })
  async readMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Req() req: { user: ActiveUser },
  ) {
    return await this.chatService.readMessages(roomId, req.user.sub);
  }
}
