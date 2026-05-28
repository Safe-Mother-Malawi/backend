/**
 * Frontend Configuration
 * Centralized configuration for all deployed frontends
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
      'http://localhost:3000',
    ],
    description: 'Main patient and clinician application',
    environment: 'production',
  },
  {
    id: 'admin-dashboard',
    name: 'Safe Mother Malawi - Admin Dashboard',
    urls: [
      'https://safe-mother-malawi-admin.vercel.app',
      'http://localhost:3001',
    ],
    description: 'Admin dashboard for system management',
    environment: 'production',
  },
  {
    id: 'mobile-web',
    name: 'Safe Mother Malawi - Mobile Web',
    urls: [
      'https://safe-mother-malawi-mobile.vercel.app',
      'http://localhost:3002',
    ],
    description: 'Mobile-optimized web application',
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

  // Add localhost patterns for development
  origins.push(/^http:\/\/localhost:\d+$/);
  origins.push(/^http:\/\/127\.0\.0\.1:\d+$/);

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
 */
export function isOriginAllowed(origin: string): boolean {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl)

  const allowedOrigins = getAllowedOrigins();

  return allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    return allowed.test(origin);
  });
}
