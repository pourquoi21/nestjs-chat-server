import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('chat_messages') // DB 테이블 이름과 일치
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room_id: number;

  @Column()
  sender_id: number;

  @Column('text')
  content: string;

  @CreateDateColumn()
  created_at: Date;
}
