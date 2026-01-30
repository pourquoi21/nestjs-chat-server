import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRoomMember } from './entities/chat-room-member-entity';
import { ChatRoom } from './entities/chat-room-entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ChatMessage, ChatRoom, ChatRoomMember, User]),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
