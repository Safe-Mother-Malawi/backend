import { Logger } from '@nestjs/common';

/**
 * Firebase configuration helper
 * Validates and parses Firebase service account from environment
 */
export class FirebaseConfig {
  private static readonly logger = new Logger(FirebaseConfig.name);

  /**
   * Get Firebase service account from environment
   */
  static getServiceAccount(): Record<string, any> {
    try {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccountJson) {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT environment variable not set. Push notifications will be disabled.',
        );
        return {};
      }

      const serviceAccount = JSON.parse(serviceAccountJson);

      // Validate required fields
      const requiredFields = [
        'type',
        'project_id',
        'private_key_id',
        'private_key',
        'client_email',
        'client_id',
        'auth_uri',
        'token_uri',
      ];

      const missingFields = requiredFields.filter((field) => !serviceAccount[field]);

      if (missingFields.length > 0) {
        this.logger.error(
          `Firebase service account missing required fields: ${missingFields.join(', ')}`,
        );
        return {};
      }

      this.logger.log('Firebase service account loaded successfully');
      return serviceAccount;
    } catch (error) {
      this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
      return {};
    }
  }

  /**
   * Validate Firebase configuration
   */
  static validate(): boolean {
    const serviceAccount = this.getServiceAccount();
    return Object.keys(serviceAccount).length > 0;
  }

  /**
   * Get Firebase project ID
   */
  static getProjectId(): string | null {
    const serviceAccount = this.getServiceAccount();
    return serviceAccount.project_id || null;
  }

  /**
   * Get Firebase database URL
   */
  static getDatabaseUrl(): string | null {
    const projectId = this.getProjectId();
    if (!projectId) return null;
    return `https://${projectId}.firebaseio.com`;
  }

  /**
   * Get Firebase storage bucket
   */
  static getStorageBucket(): string | null {
    const projectId = this.getProjectId();
    if (!projectId) return null;
    return `${projectId}.appspot.com`;
  }

  /**
   * Log Firebase configuration (safe - no secrets)
   */
  static logConfiguration(): void {
    const serviceAccount = this.getServiceAccount();
    if (Object.keys(serviceAccount).length === 0) {
      this.logger.warn('Firebase not configured');
      return;
    }

    this.logger.log(`Firebase Project ID: ${serviceAccount.project_id}`);
    this.logger.log(`Firebase Client Email: ${serviceAccount.client_email}`);
    this.logger.log(`Firebase Auth URI: ${serviceAccount.auth_uri}`);
    this.logger.log(`Firebase Token URI: ${serviceAccount.token_uri}`);
  }
}
