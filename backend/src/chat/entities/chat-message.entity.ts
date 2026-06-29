import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MessageType {
  CHAT = 'chat',
  SYSTEM = 'system',
}

@Entity('chat_messages') // DB 테이블 이름과 일치
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  room_id!: number;

  @Column({ nullable: true })
  sender_id!: number | null;

  @Column('text')
  content!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sender_id' })
  user!: User | null;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.CHAT,
  })
  type!: MessageType;

  @CreateDateColumn()
  created_at!: Date;
}
