import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages') // DB 테이블 이름과 일치
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  room_id!: number;

  @Column()
  sender_id!: number;

  @Column('text')
  content!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  user!: User;

  @CreateDateColumn()
  created_at!: Date;
}
