import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ChatGateway } from './chat/chat.gateway';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // 1. .env 파일을 전역에서 쓸 수 있게 로드 (Spring의 application.yml 로딩과 동일)
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. DB 연결 설정에 ConfigService 주입 (Spring의 @Value("${...}") 방식)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        // entities: [User],
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
      }),
    }),
    UsersModule,
    AuthModule,
    ChatModule,
  ],
  providers: [],
})
export class AppModule {}
