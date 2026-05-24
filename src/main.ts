import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { express } from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Create uploads directory if it doesn't exist ──────────────────────────
  const uploadsDir = join(process.cwd(), 'uploads');
  const profilePhotosDir = join(uploadsDir, 'profile-photos');
  
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  if (!existsSync(profilePhotosDir)) {
    mkdirSync(profilePhotosDir, { recursive: true });
  }

  // ── Body parsers ─────────────────────────────────────────────────────────
  // Must be registered before global pipes.
  app.use(require('express').urlencoded({ extended: true }));
  app.use(require('express').json());

  // ── Static file serving ──────────────────────────────────────────────────
  app.use('/uploads', require('express').static(uploadsDir));

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ── CORS (completely open for development) ──
  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['*'], // Allow all headers
    exposedHeaders: ['*'], // Expose all headers
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200,
    maxAge: 86400,
  });

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for Render
  console.log(`🚀 SafeMother Malawi API running on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
