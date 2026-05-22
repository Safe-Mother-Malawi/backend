import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        // Get service account from environment
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (!serviceAccountJson) {
          this.logger.warn(
            'FIREBASE_SERVICE_ACCOUNT environment variable not set. Firebase will be disabled.',
          );
          return;
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        // Initialize Firebase Admin SDK
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.logger.log('Firebase Admin SDK initialized successfully');
        this.logger.log(`Project ID: ${serviceAccount.project_id}`);
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Get Firebase Messaging instance
   */
  getMessaging(): admin.messaging.Messaging {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.messaging(this.firebaseApp);
  }

  /**
   * Get Firebase Auth instance
   */
  getAuth(): admin.auth.Auth {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.auth(this.firebaseApp);
  }

  /**
   * Get Firebase Firestore instance
   */
  getFirestore(): admin.firestore.Firestore {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.firestore(this.firebaseApp);
  }

  /**
   * Get Firebase Realtime Database instance
   */
  getDatabase(): admin.database.Database {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.database(this.firebaseApp);
  }

  /**
   * Get Firebase Storage instance
   */
  getStorage(): admin.storage.Storage {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.storage(this.firebaseApp);
  }

  /**
   * Check if Firebase is initialized
   */
  isInitialized(): boolean {
    return this.firebaseApp !== undefined && this.firebaseApp !== null;
  }

  /**
   * Get Firebase app instance
   */
  getApp(): admin.app.App {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return this.firebaseApp;
  }
}
