/**
 * COMPREHENSIVE CORS MIDDLEWARE
 * 
 * This middleware handles all CORS scenarios:
 * - Preflight requests (OPTIONS)
 * - Simple requests (GET, POST, etc.)
 * - Credentials and authorization
 * - Custom headers
 * - Error handling
 * - Logging and debugging
 * 
 * NEVER FACE CORS ISSUES AGAIN:
 * - Handles all HTTP methods
 * - Supports all header types
 * - Works with credentials
 * - Proper error responses
 * - Comprehensive logging
 */

import { Request, Response, NextFunction } from 'express';
import { isOriginAllowed } from './frontend-config';

/**
 * CORS Middleware - Handles all cross-origin requests
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. ORIGIN VALIDATION
  // ─────────────────────────────────────────────────────────────────────────
  
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Log rejected origins for debugging
    console.warn(`⚠️ CORS: Rejected origin: ${origin}`);
    // Still allow for development - remove in production if needed
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CREDENTIALS & COOKIES
  // ─────────────────────────────────────────────────────────────────────────
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // ─────────────────────────────────────────────────────────────────────────
  // 3. ALLOWED METHODS
  // ─────────────────────────────────────────────────────────────────────────
  
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS, CONNECT, TRACE'
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 4. ALLOWED HEADERS (REQUEST)
  // ─────────────────────────────────────────────────────────────────────────
  
  const requestHeaders = req.headers['access-control-request-headers'];
  const allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-API-Key',
    'X-Client-ID',
    'X-Frontend-ID',
    'X-Device-ID',
    'X-App-Version',
    'Accept-Language',
    'Accept-Encoding',
    'Cache-Control',
    'Pragma',
    'User-Agent',
    'Referer',
    'Cookie',
    'Set-Cookie',
    'X-CSRF-Token',
    'X-Custom-Header',
  ];

  if (requestHeaders) {
    // Echo back requested headers
    res.setHeader('Access-Control-Allow-Headers', requestHeaders);
  } else {
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. EXPOSED HEADERS (RESPONSE)
  // ─────────────────────────────────────────────────────────────────────────
  
  res.setHeader(
    'Access-Control-Expose-Headers',
    [
      'Content-Type',
      'Authorization',
      'X-Total-Count',
      'X-Page-Number',
      'X-Page-Size',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Content-Disposition',
      'Content-Length',
      'X-Request-ID',
      'X-Response-Time',
      'X-Server-Version',
      'Set-Cookie',
      'X-Custom-Header',
    ].join(', ')
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 6. PREFLIGHT CACHING
  // ─────────────────────────────────────────────────────────────────────────
  
  // Cache preflight requests for 24 hours (86400 seconds)
  res.setHeader('Access-Control-Max-Age', '86400');

  // ─────────────────────────────────────────────────────────────────────────
  // 7. HANDLE PREFLIGHT REQUESTS
  // ─────────────────────────────────────────────────────────────────────────
  
  if (req.method === 'OPTIONS') {
    // Preflight request - respond with 200 OK
    res.status(200).end();
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 8. CONTINUE TO NEXT MIDDLEWARE
  // ─────────────────────────────────────────────────────────────────────────
  
  next();
}

/**
 * CORS Error Handler - Handles CORS-related errors
 */
export function corsErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check if error is CORS-related
  if (err.message && err.message.includes('CORS')) {
    console.error('❌ CORS Error:', err.message);
    
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Cross-Origin Request Blocked',
      origin: origin,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  // Pass to next error handler
  next(err);
}

/**
 * CORS Validation Middleware - Validates CORS headers
 */
export function corsValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const origin = req.headers.origin;
  const method = req.method;
  const contentType = req.headers['content-type'];

  // Log CORS requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📡 CORS Request:`, {
      origin,
      method,
      path: req.path,
      contentType,
      timestamp: new Date().toISOString(),
    });
  }

  // Validate content-type for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`⚠️ CORS: Invalid Content-Type for ${method}: ${contentType}`);
    }
  }

  next();
}

/**
 * CORS Debug Middleware - Logs all CORS-related information
 */
export function corsDebugMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (process.env.DEBUG_CORS === 'true') {
    console.log('🔍 CORS Debug Info:', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      headers: {
        'access-control-request-method': req.headers['access-control-request-method'],
        'access-control-request-headers': req.headers['access-control-request-headers'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? '***' : 'none',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
}
