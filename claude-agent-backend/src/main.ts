import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use('/outputs', express.static(join(process.cwd(), 'outputs')));
  
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: [
      'http://localhost:4175',
      'http://localhost:4174',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:4175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  
  console.log(`\n✅ Claude Agent Backend Running!`);
  console.log(`🔌 Server: http://localhost:${PORT}`);
  console.log(`🎨 GUI: http://localhost:4175\n`);
}
bootstrap();
