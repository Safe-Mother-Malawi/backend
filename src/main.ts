import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getAllowedOrigins, isOriginAllowed } from './config/frontend-config';

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

  // ── CORS Configuration for Multiple Frontends ──
  const allowedOrigins = getAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Frontend-ID', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
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
