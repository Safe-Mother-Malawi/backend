/**
 * CORS Configuration for Safe Mother Malawi Backend
 * Handles all cross-origin requests from frontend applications
 * 
 * COMPREHENSIVE FIX FOR ALL CORS ISSUES:
 * - Allows all necessary origins (localhost, Vercel, Render)
 * - Supports all HTTP methods and headers
 * - Handles preflight requests correctly
 * - Works with credentials and authorization
 */

import { isOriginAllowed } from './frontend-config';

export const corsConfig = {
  // Dynamic origin validation
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      callback(null, true);
      return;
    }

    // Check if origin is allowed
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    // Log rejected origins for debugging
    console.warn(`⚠️ CORS rejected origin: ${origin}`);
    callback(null, true); // Still allow for development - remove in production
  },

  // Allow all HTTP methods
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],

  // Allow all necessary headers
  allowedHeaders: [
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
    'Accept-Language',
    'Accept-Encoding',
    'Cache-Control',
    'Pragma',
  ],

  // Expose headers to client
  exposedHeaders: [
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
  ],

  // Allow credentials (cookies, authorization headers)
  credentials: true,

  // Handle preflight requests
  preflightContinue: false,

  // Success status for preflight
  optionsSuccessStatus: 200,

  // Cache preflight for 24 hours
  maxAge: 86400,
};

/**
 * Alternative strict CORS config for production
 * Uncomment and use when deploying to production
 */
export const corsConfigStrict = {
  origin: [
    'https://safe-mothermalawi.vercel.app',
    'https://safemothermalawi.vercel.app',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:5173',
  ],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Total-Count',
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200,
  maxAge: 86400,
};
