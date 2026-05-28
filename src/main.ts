import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors.config';
import { corsMiddleware, corsErrorHandler, corsValidationMiddleware, corsDebugMiddleware } from './config/cors-middleware';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getAllowedOrigins, isOriginAllowed } from './config/frontend-config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
    logger.log('Starting application bootstrap...');
    
    const app = await NestFactory.create(AppModule);
    logger.log('✅ AppModule created successfully');

    // ── Create uploads directory if it doesn't exist ──────────────────────────
    const uploadsDir = join(process.cwd(), 'uploads');
    const profilePhotosDir = join(uploadsDir, 'profile-photos');
    
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
      logger.log(`✅ Created uploads directory: ${uploadsDir}`);
    }
    if (!existsSync(profilePhotosDir)) {
      mkdirSync(profilePhotosDir, { recursive: true });
      logger.log(`✅ Created profile photos directory: ${profilePhotosDir}`);
    }

    // ── Body parsers ─────────────────────────────────────────────────────────
    // Must be registered before global pipes.
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    app.use(express.json({ limit: '50mb' }));
    logger.log('✅ Body parsers configured');

    // ── Static file serving ──────────────────────────────────────────────────
    app.use('/uploads', express.static(uploadsDir));
    logger.log('✅ Static file serving configured');

    // ── COMPREHENSIVE CORS MIDDLEWARE ────────────────────────────────────────
    // This handles all CORS scenarios and prevents future CORS issues
    app.use(corsDebugMiddleware);        // Debug logging (if DEBUG_CORS=true)
    app.use(corsValidationMiddleware);   // Validate CORS headers
    app.use(corsMiddleware);             // Main CORS handler
    logger.log('✅ Comprehensive CORS middleware configured');

    // ── Global validation ────────────────────────────────────────────────────
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    );
    logger.log('✅ Global validation pipes configured');

    // ── CORS Configuration (NestJS built-in) ────────────────────────────────
    // This is a backup to the middleware above
    app.enableCors(corsConfig);
    logger.log('✅ NestJS CORS configured (backup)');

    // ── Global prefix ────────────────────────────────────────────────────────
    app.setGlobalPrefix('api/v1');
    logger.log('✅ Global prefix set to /api/v1');

    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0'); // Bind to 0.0.0.0 for Render
    logger.log(`🚀 SafeMother Malawi API running on http://0.0.0.0:${port}/api/v1`);
    logger.log(`📡 CORS enabled for: ${getAllowedOrigins().length} origins`);
  } catch (error) {
    logger.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
