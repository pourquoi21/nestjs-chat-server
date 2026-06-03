import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // NOTE: .env 파일을 전역에서 쓸 수 있게 로드 (Spring의 application.yml 로딩과 동일)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // NOTE: DB 연결 설정에 ConfigService 주입 (Spring의 @Value("${...}") 방식)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        timezone: '+09:00',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        // entities: [User],
        autoLoadEntities: true,
        synchronize: false, // NOTE: true로 두면 엔티티/코드를 고치면 서버 켤때 DB테이블도 알아서 고침
        charset: 'utf8mb4_general_ci',
        logging: true,
      }),
    }),
    UsersModule,
    AuthModule,
    ChatModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
