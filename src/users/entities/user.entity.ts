import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number; // PK는 필수

  @Column({ unique: true })
  email: string; // 👈 이거 없으면 user.email 못 씀!

  @Column()
  password: string;

  @Column()
  nickname: string; // 👈 이것도 추가!
}
