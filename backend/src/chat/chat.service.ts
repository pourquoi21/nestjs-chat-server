import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, LessThan, Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { User } from '../users/entities/user.entity';
import { ChatRoom } from './entities/chat-room-entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { ActiveUser } from '../auth/interfaces/active-user.interface';
import { InviteMembersDto } from './dto/invite-members.dto';
import { MessageType } from './entities/chat-message.entity';
import { getSystemErrorMap } from 'util';

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
  async getMyRooms(userId: number): Promise<ChatRoom[]> {
    const memberships = await this.chatRoomMemberRepository.find({
      where: { user_id: userId },
      relations: ['room'],
      order: { joined_at: 'DESC' },
    });

    return memberships.map((membership) => membership.room);
  }

  // 과거 메시지 불러오기 (최신순 50개)
  async getMessages(roomId: number, cursor?: number): Promise<ChatMessage[]> {
    const take = 50; // 한번에 가져올 개수

    const whereCondition: any = {
      room_id: roomId,
    };

    if (cursor) {
      // cursor: 마지막으로 본 메시지 ID
      whereCondition.id = LessThan(cursor);
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

  // (누군가를 초대한) 방 만들기
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

  // 유저 추가 초대하기
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

      
      // const invitedUsersNicknames = invitedUsersEntities.map((e) => e.nickname).join(', ');
      
      const members = newUserIds.map((userId) => {
        const member = new ChatRoomMember();
        member.room_id = roomId;
        member.user_id = userId;
        return member;
      });
      
      // await this.chatRoomMemberRepository.save(members);
      await queryRunner.manager.save(ChatRoomMember, members);
      // console.log(`[DB 저장됨] ${invitedUsersNicknames}가 방 ${roomId}의 멤버가 됨`);
      
      // 닉네임을 구함
      const invitedUsersEntities = await queryRunner.manager.find(User, {
        where: { id: In(newUserIds) },
        select: ['nickname']
      })
      
      const invitedNicknames = 
        invitedUsersEntities.map((u) => u.nickname);

      const systemMessage = new ChatMessage();
      systemMessage.room_id = roomId;
      systemMessage.sender_id = null;
      systemMessage.content = `${invitedNicknames.join(', ')}님이 초대되었습니다.`;
      systemMessage.type = MessageType.SYSTEM;

      await queryRunner.manager.save(ChatMessage, systemMessage);

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

  // [HTTP용] 방에 들어가면 DB에 멤버로 insert하는 메서드
  // controller에서 호출
  async joinRoomMember(roomId: number, userId: number) {
    const room = await this.chatRoomRepository.findOneBy({ id: roomId });
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
}
