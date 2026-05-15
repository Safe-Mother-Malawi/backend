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

  // ── CORS (comprehensive configuration for Flutter web and all environments) ──
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all localhost origins for development (explicit patterns)
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // Allow specific localhost ports used by Flutter
      const localhostOrigins = [
        'http://localhost:5004',
        'http://localhost:5002',
        'http://localhost:3000',
        'http://127.0.0.1:5004',
        'http://127.0.0.1:5002',
        'http://127.0.0.1:3000',
      ];
      
      if (localhostOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow Vercel deployments (including the specific deployment URL)
      if (origin.includes('vercel.app') || origin.includes('safe-mother-malawi')) {
        return callback(null, true);
      }
      
      // Allow specific production domains
      const allowedOrigins = [
        'https://safemothermalawi-silk.vercel.app',
        'https://safemothermalawi.vercel.app',
        'https://safe-mother-malawi-elv2sx4cffotkh1xrjjj1cqvcbsd.vercel.app',
        'https://safe-mother-malawi.vercel.app',
      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // Log rejected origins for debugging
      console.log('CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'Origin', 
      'X-Requested-With',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    maxAge: 86400, // Cache preflight response for 24 hours
  });

  // ── Global prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for Render
  console.log(`🚀 SafeMother Malawi API running on http://0.0.0.0:${port}/api/v1`);
}
bootstrap();
