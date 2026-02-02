import {
  Body,
  Controller, Delete,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/:roomId/messages')
  async getRoomMessages(
    @Param('roomId', ParseIntPipe) roomId: number,
  ): Promise<ChatMessage[]> {
    return await this.chatService.getMessagesByRoom(roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  async createRoom(
    @Req() req: { user: ActiveUser },
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return await this.chatService.createRoom(req.user, createRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('rooms/:roomId/members')
  async leaveRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Req() req: { user: ActiveUser },
  ) {
    return await this.chatService.leaveRoom(roomId, req.user.sub);
  }
}
