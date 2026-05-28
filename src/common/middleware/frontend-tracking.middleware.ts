import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to track which frontend is making API requests
 * Useful for analytics, debugging, and monitoring
 */
@Injectable()
export class FrontendTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('FrontendTracking');

  use(req: Request, res: Response, next: NextFunction) {
    // Get frontend identifier from header or origin
    const frontendId = req.headers['x-frontend-id'] as string || this.extractFrontendFromOrigin(req.headers.origin as string);
    
    // Attach to request for use in controllers/services
    (req as any).frontendId = frontendId;
    
    // Log the request
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.path;
    const statusCode = res.statusCode;
    
    // Log after response is sent
    res.on('finish', () => {
      this.logger.debug(
        `[${timestamp}] Frontend: ${frontendId} | ${method} ${path} | Status: ${res.statusCode}`
      );
    });
    
    next();
  }

  /**
   * Extract frontend identifier from origin URL
   */
  private extractFrontendFromOrigin(origin: string): string {
    if (!origin) return 'unknown';
    
    if (origin.includes('safemothermalawi.vercel.app')) {
      return 'main-app';
    }
    if (origin.includes('safe-mother-malawi-admin.vercel.app')) {
      return 'admin-dashboard';
    }
    if (origin.includes('safe-mother-malawi-mobile.vercel.app')) {
      return 'mobile-web';
    }
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'local-dev';
    }
    
    return 'unknown';
  }
}
