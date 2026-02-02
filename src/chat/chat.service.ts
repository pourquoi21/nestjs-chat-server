import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { User } from '../users/entities/user.entity';
import { ChatRoom } from './entities/chat-room-entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { ActiveUser } from '../auth/interfaces/active-user.interface';
import { NotFoundError } from 'rxjs';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    @InjectRepository(ChatRoomMember)
    private chatRoomMemberRepository: Repository<ChatRoomMember>,
    @InjectRepository(ChatRoom)
    private chatRoom: Repository<ChatRoom>,
  ) {}

  // 메시지 저장하기
  async saveMessage(room_id: number, sender_id: number, content: string) {
    const newMessage = this.chatRepository.create({
      room_id,
      sender_id,
      content,
    });
    return await this.chatRepository.save(newMessage);
  }

  // 과거 메시지 불러오기 (최신순 50개)
  async getMessagesByRoom(roomId: number): Promise<ChatMessage[]> {
    return await this.chatRepository.find({
      where: { room_id: roomId },
      order: { created_at: 'ASC' }, // 오래된 순서대로
      take: 50,
    });
  }

  // (누군가를 초대한) 방 만들기
  async createRoom(user: ActiveUser, createRoomDto: CreateRoomDto) {
    const { title, invitedUserIds } = createRoomDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let roomTitle = title;

      // 방제가 없으면 초대된 사람들 닉네임으로 방제를 자동 생성
      // '나'도 포함하도록 수정함
      if (!roomTitle) {
        // const invitedUsers = await this.userRepository.find({
        //   where: { id: In(invitedUserIds) }, // invitedUserIds에 있는 ID들 모두 조회
        //   select: ['nickname'], // 닉네임만 가져오기
        // });
        // roomTitle = invitedUsers.map((u) => u.nickname).join(', ');
        const allMemberIds = [...new Set([user.sub, ...invitedUserIds])];

        const memberEntities = await this.userRepository.find({
          where: { id: In(allMemberIds) },
          select: ['nickname'],
        });

        roomTitle = memberEntities.map((u) => u.nickname).join(', ');
      }

      // 방 만들기 (제목이 없으면 기본값이라도 넣기)
      const newRoom = new ChatRoom();
      newRoom.title = roomTitle || '대화방'; // 위에서 닉네임을 못 구했다면 기본값으로
      const savedRoom = await queryRunner.manager.save(ChatRoom, newRoom);

      // 멤버 명단 만들기 (나 + 초대된 사람들)
      // Set을 써서 혹시 모를 중복 ID 제거 (안전장치)
      const allMemberIds = [...new Set([user.sub, ...invitedUserIds])];

      const members = allMemberIds.map((userId) => {
        const member = new ChatRoomMember();
        member.room_id = savedRoom.id;
        member.user_id = userId;
        return member;
      });

      // 멤버 저장
      await queryRunner.manager.save(ChatRoomMember, members);

      await queryRunner.commitTransaction();

      return {
        roomId: savedRoom.id,
        title: savedRoom.title,
        message: '방 생성 완료',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 방에 들어가기
  async joinRoom(roomId: number, userId: number) {
    const room = await this.chatRoom.findOneBy({ id: roomId });
    if (!room) throw new NotFoundException('방이 존재하지 않습니다.');

    const existingMember = await this.chatRoomMemberRepository.findOne({
      where: { room_id: roomId, user_id: userId },
    });

    if (!existingMember) {
      const newMember = this.chatRoomMemberRepository.create({
        room_id: roomId,
        user_id: userId,
      });
      await this.chatRoomMemberRepository.save(newMember);
      console.log(`[DB 저장됨] 유저 ${userId}가 방 ${roomId}의 멤버가 됨`);
    }
  }

  // 방에서 나가기
  async leaveRoom(roomId: number, userId: number) {
    const result = await this.chatRoomMemberRepository.delete({
      room_id: roomId,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('해당 방에 참여하고 있지 않은 사용자입니다.');
    }
    return { message: '방에서 성공적으로 나갔습니다.' };
  }
}
