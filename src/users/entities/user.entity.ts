import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number; // PK는 필수

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  nickname: string;
}
