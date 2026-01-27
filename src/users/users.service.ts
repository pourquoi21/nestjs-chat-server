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

    // 생성용 (create) - Raw Query 유지용 DataSource 사용
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, nickname } = createUserDto;
    console.log('1. 서비스 진입 완료'); // 로그 추가

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('2. 비밀번호 해싱 완료'); // 로그 추가

    try {
      console.log('3. DB 쿼리 실행 직전...');
      const result = (await this.dataSource.query(
        `INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)`,
        [email, hashedPassword, nickname],
      )) as unknown;
      console.log('4. DB 쿼리 완료:', result);
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

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // findByEmail(email: string) {
  //   return `This action returns a #${email} user`;
  // }

  async findByEmail(email: string): Promise<User | null> {
    // 실제 DB 조회: "email 컬럼이 이 파라미터랑 같은 놈 하나 찾아줘"
    return this.usersRepository.findOne({ where: { email } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
