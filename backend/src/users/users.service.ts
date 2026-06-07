import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  // constructor(private dataSource: DataSource) {}
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>, // DataSource 대신 이거 씀

    // create - Raw Query 유지용 DataSource 사용
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, nickname } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = (await this.dataSource.query(
        `INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)`,
        [email, hashedPassword, nickname],
      )) as unknown;
      return { success: true, message: '회원가입 성공' };
    } catch (error) {
      const dbError = error as { code: string };
      if (dbError.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }
      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }
  // 로그인 시 비밀번호 검증용 메서드
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async findAll(): Promise<User[]> {
    // return `This action returns all users`;
    const allUsers = await this.usersRepository.find();

    // TODO: chatservice에서처럼 take와 skip(offset)으로
    // 잘라서 가져올수 있게 처리 해야함.
    return allUsers;
  }

  async findOne(id: number): Promise<User | null> {
    // return `This action returns a #${id} user`;
    const user = await this.usersRepository.findOne({
      where: { id: id },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    // 실제 DB 조회
    return this.usersRepository
      .findOne({ where: { email } });
  }

  // 해당 쿼리 쓸때는 password강제 select함
  async findByEmailWithPassword(email: string): Promise<User | null> {
    // 실제 DB 조회
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number) {
    return await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'email', 'nickname'],
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
