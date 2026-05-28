/**
 * Frontend Configuration
 * Centralized configuration for all deployed frontends
 * 
 * COMPREHENSIVE CORS FIX:
 * - Includes all Vercel deployment URLs
 * - Includes all localhost development URLs
 * - Includes Render backend URL
 * - Supports all frontend variations
 */

export interface FrontendConfig {
  id: string;
  name: string;
  urls: string[];
  description: string;
  environment: 'production' | 'development' | 'staging';
}

export const FRONTEND_CONFIGS: FrontendConfig[] = [
  {
    id: 'main-app',
    name: 'Safe Mother Malawi - Main App',
    urls: [
      'https://safemothermalawi.vercel.app',
      'https://safe-mother-malawi.vercel.app',
      'https://safe-mothermalawi.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
    ],
    description: 'Main patient and clinician application',
    environment: 'production',
  },
  {
    id: 'admin-dashboard',
    name: 'Safe Mother Malawi - Admin Dashboard',
    urls: [
      'https://safe-mother-malawi-admin.vercel.app',
      'https://safemothermalawi-admin.vercel.app',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
    ],
    description: 'Admin dashboard for system management',
    environment: 'production',
  },
  {
    id: 'mobile-web',
    name: 'Safe Mother Malawi - Mobile Web',
    urls: [
      'https://safe-mother-malawi-mobile.vercel.app',
      'https://safemothermalawi-mobile.vercel.app',
      'http://localhost:3002',
      'http://localhost:5173',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:5173',
    ],
    description: 'Mobile-optimized web application',
    environment: 'production',
  },
  {
    id: 'backend-render',
    name: 'Backend - Render',
    urls: [
      'https://backend-gsgb.onrender.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    description: 'Backend API server',
    environment: 'production',
  },
];

/**
 * Get all allowed origins for CORS
 */
export function getAllowedOrigins(): (string | RegExp)[] {
  const origins: (string | RegExp)[] = [];

  // Add all configured frontend URLs
  FRONTEND_CONFIGS.forEach(config => {
    origins.push(...config.urls);
  });

  // Add localhost patterns for development (any port)
  origins.push(/^http:\/\/localhost:\d+$/);
  origins.push(/^http:\/\/127\.0\.0\.1:\d+$/);
  origins.push(/^http:\/\/0\.0\.0\.0:\d+$/);

  // Add Vercel preview deployments
  origins.push(/^https:\/\/.*\.vercel\.app$/);

  // Add Render deployments
  origins.push(/^https:\/\/.*\.onrender\.com$/);

  return origins;
}

/**
 * Get frontend config by URL
 */
export function getFrontendConfigByUrl(url: string): FrontendConfig | undefined {
  return FRONTEND_CONFIGS.find(config =>
    config.urls.some(configUrl => url.includes(configUrl))
  );
}

/**
 * Get frontend config by ID
 */
export function getFrontendConfigById(id: string): FrontendConfig | undefined {
  return FRONTEND_CONFIGS.find(config => config.id === id);
}

/**
 * Check if URL is allowed
 * COMPREHENSIVE CHECK:
 * - Exact string matches
 * - Regex pattern matches
 * - Wildcard domain matches
 */
export function isOriginAllowed(origin: string): boolean {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl)

  const allowedOrigins = getAllowedOrigins();

  return allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed || origin.includes(allowed);
    }
    return allowed.test(origin);
  });
}
