import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, LessThan, MoreThan, And, Not, Repository } from 'typeorm';
import { ActiveUser } from '../auth/interfaces/active-user.interface';
import { User } from '../users/entities/user.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { InviteMembersDto } from './dto/invite-members.dto';
import { RoomMemberDto } from './dto/room-member.dto';
import { ChatMessage, MessageType } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room-entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';

export type ChatRoomWithReadStatus = ChatRoom & {
  unread_count: number;
};

@Injectable()
export class ChatService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChatRoomMember)
    private chatRoomMemberRepository: Repository<ChatRoomMember>,
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
  ) {}

  // 메시지 저장하기
  async saveMessage(room_id: number, sender_id: number, content: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 메시지 객체'만' 생성
      const newMessage = this.chatRepository.create({
        room_id,
        sender_id,
        content,
      });

      // 메시지 저장
      // queryRunner로 하나로 묶어줌
      const savedMessage = await queryRunner.manager.save(
        ChatMessage,
        newMessage,
      );

      await queryRunner.manager.update(ChatRoom, room_id, {
        last_message: content,
        last_message_at: savedMessage.created_at,
      });

      await queryRunner.commitTransaction();

      return savedMessage;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      queryRunner.release();
    }
  }

  // 유저가 속한 방을 불러오기
  async getMyRooms(userId: number): Promise<ChatRoomWithReadStatus[]> {
    const memberships = await this.chatRoomMemberRepository.find({
      where: { user_id: userId },
      relations: ['room'],
      order: { joined_at: 'DESC' },
    });

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const room = membership.room;

        const unreadCount = await this.chatRepository.count({
          where: {
            room_id: room.id,
            id: MoreThan(membership.last_read_message_id),
            sender_id: Not(IsNull()),
          },
        });

        return {
          ...room,
          unread_count: unreadCount,
        } as ChatRoomWithReadStatus;
      })
    );
    return results;
  }

  // 과거 메시지 불러오기 (최신순 50개)
  async getMessages(
    roomId: number,
    userId: number,
    cursor?: number,
  ): Promise<ChatMessage[]> {
    const take = 50; // 한번에 가져올 개수

    const membership = await this.chatRoomMemberRepository.findOne({
      where: { room_id: roomId, user_id: userId },
    })

    const minVisibleMessageId = membership?.min_visible_message_id ?? 0;

    const whereCondition: any = {
      room_id: roomId,
      id: MoreThan(minVisibleMessageId),
    };

    if (cursor) {
      // cursor: 마지막으로 본 메시지 ID
      whereCondition.id = And(MoreThan(minVisibleMessageId), LessThan(cursor));
    }

    const messages = await this.chatRepository.find({
      where: whereCondition,
      relations: ['user'],
      select: {
        id: true,
        content: true,
        created_at: true,
        user: {
          id: true,
          nickname: true,
        },
        type: true,
      },
      order: {
        created_at: 'DESC',
      },
      take: take,
    });
    // console.log(messages);

    // 프론트에서 읽기 편하게 뒤집어주기
    return messages.reverse();
  }

  // 참여중인 유저 목록 가져오기
  async getMembers(roomId: number, cursor?: number): Promise<RoomMemberDto[]> {
    const members = await this.chatRoomMemberRepository.find({
      where: {room_id: roomId},
      relations: ['user'],
    });

    return members.map((m) => m.user);
  }

  // 방 만들기
  async createRoom(user: ActiveUser, createRoomDto: CreateRoomDto) {
    const { title } = createRoomDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 방 만들기
      const newRoom = new ChatRoom();
      newRoom.title = title || '대화방';
      const savedRoom = await queryRunner.manager.save(ChatRoom, newRoom);

    
      // 멤버: 방장
      const member = new ChatRoomMember();
      member.room_id = savedRoom.id;
      member.user_id = user.sub;
      await queryRunner.manager.save(ChatRoomMember,member);

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

  // 유저 초대하기
  async inviteMembers(
    roomId: number,
    requesterId: number,
    inviteMembersDto: InviteMembersDto): Promise<{ invitedNicknames: string[] }> {
    const { invitedUserIds } = inviteMembersDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 요청자가 방 멤버인지 확인
      const membership = await queryRunner.manager.findOne(ChatRoomMember, {
        where: { room_id: roomId, user_id: requesterId },
      });

      if (!membership) throw new NotFoundException('방에 참여하고 있는 사람만이 초대를 할 수 있습니다.');

      if (invitedUserIds.includes(requesterId)) {
        throw new BadRequestException('자기 자신은 초대할 수 없습니다.');
      }

      // 해당 방의 멤버인 유저 한번에 조회
      const existingMembers = await queryRunner.manager.find(ChatRoomMember, {
        where: { room_id: roomId, user_id: In(invitedUserIds) },
      });

      const existingUserIds = new Set(existingMembers.map((m) => m.user_id));

      // 이미 멤버인 유저는 제외
      const newUserIds = [...new Set(invitedUserIds)].filter(
        (id) => !existingUserIds.has(id)
      );

      if (newUserIds.length === 0) throw new BadRequestException('초대할 유저가 없습니다.');

      // 초대할 멤버 객체 만들기
      const members = newUserIds.map((userId) => {
        const member = new ChatRoomMember();
        member.room_id = roomId;
        member.user_id = userId;
        return member;
      });
      
      await queryRunner.manager.save(ChatRoomMember, members);
      
      // 닉네임을 구함
      const invitedUsersEntities = await queryRunner.manager.find(User, {
        where: { id: In(newUserIds) },
        select: ['nickname']
      })
      
      const invitedNicknames = 
        invitedUsersEntities.map((u) => u.nickname);

      // 시스템메시지 생성
      const systemMessage = new ChatMessage();
      systemMessage.room_id = roomId;
      systemMessage.sender_id = null;
      systemMessage.content = `${invitedNicknames.join(', ')}님이 초대되었습니다.`;
      systemMessage.type = MessageType.SYSTEM;

      await queryRunner.manager.save(ChatMessage, systemMessage);

      // 방의 마지막 메시지 id조회(새로 들어올 멤버에게 저장)
      const room = await queryRunner.manager.findOneBy(ChatRoom, { id: roomId });
     
      const lastMessage = await queryRunner.manager.findOne(ChatMessage, {
        where: { room_id: roomId },
        order: { id: 'DESC' },
      })

      const lastMessageId = lastMessage?.id ?? 0;

      // 초대된 멤버 객체에 마지막 읽은 메시지 업데이트
      await queryRunner.manager.update(
        ChatRoomMember,
        { room_id: roomId, user_id: In(newUserIds)},
        { last_read_message_id: lastMessageId,
          min_visible_message_id: lastMessageId }
      );

      await queryRunner.commitTransaction();

      // socket message는 controller에서 보낸다
      // 여기에서 보내려면 chatGateway와 순환참조 발생
      
      return { invitedNicknames };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // [Socket용] 멤버인지 DB상에서 select하여 확인만 함
  // gateway에서 호출
  async isRoomMember(roomId: number, userId: number): Promise<boolean> {
    const member = await this.chatRoomMemberRepository.findOne({
      where: { room_id: roomId, user_id: userId },
    });
    return !!member;
  }

  // 방에서 나가기
  async leaveRoom(roomId: number, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 닉네임 조회(controller에서 emit하기위해)
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        select: ['nickname'],
      });

      const result = await queryRunner.manager.delete(ChatRoomMember, {
        room_id: roomId,
        user_id: userId,
      });

      if (result.affected === 0) {
        throw new NotFoundException('해당 방에 참여하고 있지 않은 사용자입니다.');
      }

      const systemMessage = new ChatMessage();
      systemMessage.room_id = roomId;
      systemMessage.sender_id = null;
      systemMessage.content = `${user!.nickname}님이 나갔습니다.`;
      systemMessage.type = MessageType.SYSTEM;
      await queryRunner.manager.save(ChatMessage, systemMessage);

      await queryRunner.commitTransaction();   

      return { nickname: user!.nickname };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }    
  }

  // 메시지 읽음
  async readMessages(roomId: number, userId: number) {
    const lastMessage = await this.chatRepository.findOne({
      where: { room_id: roomId },
      order: { id: 'DESC' },
    });

    if (!lastMessage) return;

    await this.chatRoomMemberRepository.update(
      { room_id: roomId, user_id: userId },
      { last_read_message_id: lastMessage.id },
    );
  }
}
