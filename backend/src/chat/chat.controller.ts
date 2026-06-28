import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { ActiveUser } from '../auth/interfaces/active-user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatRoom } from './entities/chat-room-entity';
import { InviteMembersDto } from './dto/invite-members.dto';
import { ChatGateway } from './chat.gateway';

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

  @Get('rooms/unjoined')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '참여하지 않은 채팅방 목록 가져오기' })
  @ApiCreatedResponse({ description: '성공', type: [ChatRoom] })
  async getUnjoinedRooms(@Req() req: { user: ActiveUser }): Promise<ChatRoom[]> {
    return await this.chatService.getUnjoinedRooms(req.user.sub);
  }

  @Post('rooms/:roomId/join')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '기존 채팅방에 참여하기' })
  @ApiCreatedResponse({
    description: '방 참여 성공',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: '방 참여 완료',
        },
      },
    },
  })
  async joinRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Req() req: { user: ActiveUser },
  ) {
    // Service의 Insert 메서드 호출
    await this.chatService.joinRoomMember(roomId, req.user.sub);
    return { message: '방 참여 완료' };
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
    return await this.chatService.leaveRoom(roomId, req.user.sub);
  }
}
