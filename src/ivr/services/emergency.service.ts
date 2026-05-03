import { Injectable, Logger } from '@nestjs/common';
import { IvrLanguageService } from './ivr-language.service';
import { IvrLanguage } from '../config/ivr-messages.i18n';
import { AlertsService } from '../../alerts/alerts.service';
import { AlertSeverity } from '../../alerts/entities/alert.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

/**
 * Emergency Service for IVR
 * Handles emergency dispatch, location sharing, and alerts
 */

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface AmbulanceDispatchRequest {
  sessionId: string;
  location: EmergencyLocation;
  patientName?: string;
  patientPhone?: string;
  patientType?: 'prenatal' | 'neonatal';
}

export interface PoliceDispatchRequest {
  sessionId: string;
  emergencyType: 'violence' | 'crime' | 'other';
  location: EmergencyLocation;
  patientName?: string;
  patientPhone?: string;
}

export interface HospitalLookupRequest {
  sessionId: string;
  location: EmergencyLocation;
}

export interface HelplineConnectRequest {
  sessionId: string;
  patientName?: string;
  patientPhone?: string;
}

export interface EmergencyDispatchResponse {
  success: boolean;
  serviceId: string;
  estimatedArrival: number; // minutes
  dispatcherPhone: string;
  message: string;
}

export interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number; // km
  directions: string;
}

@Injectable()
export class EmergencyService {
  private readonly logger = new Logger(EmergencyService.name);

  // Mock emergency service data
  private readonly emergencyServices = {
    ambulance: {
      number: '998',
      dispatcherPhone: '+265123456789',
      estimatedArrival: 12, // minutes
    },
    police: {
      number: '997',
      dispatcherPhone: '+265987654321',
      estimatedArrival: 15, // minutes
    },
    helpline: {
      number: '116',
      dispatcherPhone: '+265555555555',
      estimatedArrival: 1, // minutes
    },
  };

  // Mock hospitals
  private readonly hospitals = [
    {
      id: 'h1',
      name: 'Lilongwe Central Hospital',
      address: 'Area 18, Lilongwe',
      phone: '+265123456789',
      latitude: -13.9626,
      longitude: 34.3015,
    },
    {
      id: 'h2',
      name: 'Blantyre District Hospital',
      address: 'Blantyre City Centre',
      phone: '+265987654321',
      latitude: -15.7942,
      longitude: 35.0050,
    },
    {
      id: 'h3',
      name: 'Mzuzu Central Hospital',
      address: 'Mzuzu City Centre',
      phone: '+265555555555',
      latitude: -11.4659,
      longitude: 34.3888,
    },
  ];

  constructor(
    private readonly languageService: IvrLanguageService,
    private readonly alertsService: AlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Dispatch ambulance
   */
  async dispatchAmbulance(req: AmbulanceDispatchRequest): Promise<EmergencyDispatchResponse> {
    try {
      this.logger.log(
        `Dispatching ambulance for session ${req.sessionId} at ${req.location.address}`,
      );

      // Create alert for clinicians
      await this.alertsService.createFromRisk({
        patientName: req.patientName || 'IVR Patient',
        patientStatus: req.patientType || 'prenatal',
        contact: req.patientPhone || `sim-${req.sessionId}`,
        reason: `AMBULANCE DISPATCH REQUESTED. Location: ${req.location.address}`,
        symptoms: ['Emergency ambulance requested via IVR'],
        severity: AlertSeverity.CRITICAL,
        patientId: null,
        clinicianId: null,
        facilityName: 'Emergency Dispatch',
        district: 'Emergency',
      });

      // Send SMS notification
      await this.sendEmergencySMS(
        req.patientPhone || `sim-${req.sessionId}`,
        `SafeMother: Ambulance dispatched to ${req.location.address}. ETA: ${this.emergencyServices.ambulance.estimatedArrival} minutes. Call 998 for updates.`,
      );

      // Log emergency dispatch
      this.logger.log(
        `Ambulance dispatched for ${req.patientName} at ${req.location.address}`,
      );

      return {
        success: true,
        serviceId: `amb-${req.sessionId}`,
        estimatedArrival: this.emergencyServices.ambulance.estimatedArrival,
        dispatcherPhone: this.emergencyServices.ambulance.dispatcherPhone,
        message: `Ambulance dispatched to ${req.location.address}. ETA: ${this.emergencyServices.ambulance.estimatedArrival} minutes.`,
      };
    } catch (error) {
      this.logger.error(`Failed to dispatch ambulance: ${error}`);
      return {
        success: false,
        serviceId: '',
        estimatedArrival: 0,
        dispatcherPhone: '',
        message: 'Failed to dispatch ambulance. Please call 998 directly.',
      };
    }
  }

  /**
   * Dispatch police
   */
  async dispatchPolice(req: PoliceDispatchRequest): Promise<EmergencyDispatchResponse> {
    try {
      this.logger.log(
        `Dispatching police for session ${req.sessionId} (${req.emergencyType}) at ${req.location.address}`,
      );

      // Create alert for clinicians
      const emergencyTypeLabel = {
        violence: 'Violence/Assault',
        crime: 'Theft/Crime',
        other: 'Other Emergency',
      }[req.emergencyType];

      await this.alertsService.createFromRisk({
        patientName: req.patientName || 'IVR Patient',
        patientStatus: 'Emergency',
        contact: req.patientPhone || `sim-${req.sessionId}`,
        reason: `POLICE DISPATCH REQUESTED. Type: ${emergencyTypeLabel}. Location: ${req.location.address}`,
        symptoms: [`Police emergency: ${emergencyTypeLabel}`],
        severity: AlertSeverity.CRITICAL,
        patientId: null,
        clinicianId: null,
        facilityName: 'Emergency Dispatch',
        district: 'Emergency',
      });

      // Send SMS notification
      await this.sendEmergencySMS(
        req.patientPhone || `sim-${req.sessionId}`,
        `SafeMother: Police dispatched to ${req.location.address}. ETA: ${this.emergencyServices.police.estimatedArrival} minutes. Call 997 for updates.`,
      );

      // Log emergency dispatch
      this.logger.log(
        `Police dispatched for ${req.patientName} (${emergencyTypeLabel}) at ${req.location.address}`,
      );

      return {
        success: true,
        serviceId: `pol-${req.sessionId}`,
        estimatedArrival: this.emergencyServices.police.estimatedArrival,
        dispatcherPhone: this.emergencyServices.police.dispatcherPhone,
        message: `Police dispatched to ${req.location.address}. ETA: ${this.emergencyServices.police.estimatedArrival} minutes.`,
      };
    } catch (error) {
      this.logger.error(`Failed to dispatch police: ${error}`);
      return {
        success: false,
        serviceId: '',
        estimatedArrival: 0,
        dispatcherPhone: '',
        message: 'Failed to dispatch police. Please call 997 directly.',
      };
    }
  }

  /**
   * Find nearest hospital
   */
  async findNearestHospital(req: HospitalLookupRequest): Promise<HospitalInfo | null> {
    try {
      this.logger.log(
        `Finding nearest hospital for session ${req.sessionId} at ${req.location.latitude}, ${req.location.longitude}`,
      );

      // Calculate distance to each hospital
      const hospitalsWithDistance = this.hospitals.map((h) => ({
        ...h,
        distance: this.calculateDistance(
          req.location.latitude,
          req.location.longitude,
          h.latitude,
          h.longitude,
        ),
      }));

      // Sort by distance and get nearest
      const nearest = hospitalsWithDistance.sort((a, b) => a.distance - b.distance)[0];

      if (!nearest) {
        this.logger.warn('No hospitals found');
        return null;
      }

      // Generate directions
      const directions = `From your location, head to ${nearest.name} at ${nearest.address}. Distance: ${nearest.distance.toFixed(1)} km.`;

      // Send SMS with directions
      await this.sendEmergencySMS(
        req.sessionId,
        `SafeMother: Nearest hospital is ${nearest.name} at ${nearest.address}. Distance: ${nearest.distance.toFixed(1)} km. Phone: ${nearest.phone}`,
      );

      this.logger.log(`Nearest hospital found: ${nearest.name} (${nearest.distance.toFixed(1)} km away)`);

      return {
        id: nearest.id,
        name: nearest.name,
        address: nearest.address,
        phone: nearest.phone,
        distance: nearest.distance,
        directions,
      };
    } catch (error) {
      this.logger.error(`Failed to find nearest hospital: ${error}`);
      return null;
    }
  }

  /**
   * Connect to helpline
   */
  async connectToHelpline(req: HelplineConnectRequest): Promise<EmergencyDispatchResponse> {
    try {
      this.logger.log(
        `Connecting to helpline for session ${req.sessionId} (${req.patientName})`,
      );

      // Log helpline connection
      await this.notificationsService.create({
        userId: req.sessionId,
        title: 'SafeMother Helpline',
        body: `Connecting to health counselor. Please wait.`,
        type: NotificationType.INFO,
      });

      this.logger.log(`Helpline connection initiated for ${req.patientName}`);

      return {
        success: true,
        serviceId: `hlp-${req.sessionId}`,
        estimatedArrival: 1,
        dispatcherPhone: this.emergencyServices.helpline.dispatcherPhone,
        message: 'Connecting to SafeMother Helpline. A health counselor will assist you shortly.',
      };
    } catch (error) {
      this.logger.error(`Failed to connect to helpline: ${error}`);
      return {
        success: false,
        serviceId: '',
        estimatedArrival: 0,
        dispatcherPhone: '',
        message: 'Failed to connect to helpline. Please call 116 directly.',
      };
    }
  }

  /**
   * Get emergency services list
   */
  getEmergencyServices(language: IvrLanguage) {
    return {
      services: [
        {
          id: 1,
          name: 'Ambulance',
          number: this.emergencyServices.ambulance.number,
          description: 'Emergency medical transport',
        },
        {
          id: 2,
          name: 'SafeMother Helpline',
          number: this.emergencyServices.helpline.number,
          description: 'Health counseling and support',
        },
        {
          id: 3,
          name: 'Police',
          number: this.emergencyServices.police.number,
          description: 'Police emergency',
        },
        {
          id: 4,
          name: 'Hospital',
          number: 'Varies',
          description: 'Find nearest hospital',
        },
      ],
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Send emergency SMS
   */
  private async sendEmergencySMS(phoneNumber: string, message: string): Promise<void> {
    try {
      // TODO: Integrate with SMS service (Twilio, etc.)
      this.logger.log(`SMS sent to ${phoneNumber}: ${message}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error}`);
    }
  }
}
