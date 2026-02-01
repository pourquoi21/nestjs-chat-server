import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ length: 10, default: 'GROUP' })
  type: string;

  @Column('text', { nullable: true })
  last_message: string;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
