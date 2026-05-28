/**
 * CORS Configuration for Safe Mother Malawi Backend
 * Handles all cross-origin requests from frontend applications
 */

export const corsConfig = {
  // Allow all origins (development-friendly)
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    // Allow all origins for now
    callback(null, true);
  },

  // Allow all HTTP methods
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],

  // Allow all headers
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
  ],

  // Expose headers to client
  exposedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Total-Count',
    'X-Page-Number',
    'X-Page-Size',
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
