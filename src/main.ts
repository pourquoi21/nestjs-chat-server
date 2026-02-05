import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { RedisIoAdapter } from './chat/redis-io.adapter';
import { Request, Response, NextFunction } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  // NOTE: chatGateway에 한 것은 socket에 설정한것
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Spring의 @Valid 어노테이션 활성화 역할
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성은 거름 (보안)
      forbidNonWhitelisted: true, // DTO에 없는 속성 들어오면 에러
      transform: true, // 타입 자동 변환
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // swagger설정
  const config = new DocumentBuilder()
    .setTitle('Real-time Chat API')
    .setDescription('NestJS + Socket.IO 채팅 서버 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log('---서버 3000 에서 시작---');
}
bootstrap();
