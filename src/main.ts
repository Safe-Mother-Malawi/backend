import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Body parsers ─────────────────────────────────────────────────────────
  // Must be registered before global pipes.
  // Africa's Talking IVR webhooks send application/x-www-form-urlencoded.
  app.use(require('express').urlencoded({ extended: true }));
  app.use(require('express').json());

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // IVR webhook fields are not a DTO — don't reject unknown keys
      transform: true,
    }),
  );

  // ── CORS (allow Flutter web + mobile dev) ────────────────────────────────
  app.enableCors({
    origin: '*', // tighten this in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 SafeMother Malawi API running on http://localhost:${port}/api/v1`);
}
bootstrap();
