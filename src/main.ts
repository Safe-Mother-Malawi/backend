import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Body parsers ─────────────────────────────────────────────────────────
  // Must be registered before global pipes.
  app.use(require('express').urlencoded({ extended: true }));
  app.use(require('express').json());

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ── CORS (allow Vercel and local development) ────────────────────────────
  app.enableCors({
    origin: [
      'https://safemothermalawi-silk.vercel.app',
      'https://safemothermalawi.vercel.app',
      'http://localhost:3000',
      'http://localhost:5001',  // Mobile app port
      'http://localhost:5002',  // Web app port
      /\.vercel\.app$/,  // Allow all Vercel preview deployments
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for Render
  console.log(`🚀 SafeMother Malawi API running on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
