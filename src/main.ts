import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    console.log('--- [미들웨어 로그 시작] ---');
    console.log(`1. 요청 주소: ${req.method} ${req.url}`);
    console.log(`2. 헤더 확인: ${req.headers['content-type']}`); // 👈 이게 진짜 중요!
    console.log('3. Body 확인:', req.body);
    console.log('--- [미들웨어 로그 끝] ---');
    next();
  });

  // Spring의 @Valid 어노테이션 활성화 역할
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성은 거름 (보안)
      forbidNonWhitelisted: true, // DTO에 없는 속성 들어오면 에러
      transform: true, // 타입 자동 변환
    }),
  );
  await app.listen(3000);
  console.log('---서버 3000 에서 시작---');
}
bootstrap();
