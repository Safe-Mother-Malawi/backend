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

  // ── CORS (allow Vercel frontend + mobile) ────────────────────────────────
  app.enableCors({
    origin: [
      'https://safe-mother-malawi-xt8u.vercel.app', // Production frontend
      'http://localhost:5173', // Local development
      'http://localhost:3000', // Local development alternative
      '*', // Allow all for mobile apps
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for Render
  console.log(`🚀 SafeMother Malawi API running on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
