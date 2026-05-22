import { NotificationType } from '../enums/notification-type.enum';

/**
 * Notification Templates for Safe Mother Malawi
 * Provides pre-formatted messages for different notification types
 */

export interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class NotificationTemplates {
  /**
   * Patient Notification Templates
   */

  static appointmentReminder(
    patientName: string,
    appointmentTime: string,
    clinicName: string,
  ): NotificationTemplate {
    return {
      title: 'Appointment Reminder',
      body: `Hi ${patientName}, you have an appointment at ${clinicName} on ${appointmentTime}. Please arrive 10 minutes early.`,
      data: {
        type: NotificationType.APPOINTMENT_REMINDER,
        action: 'view_appointment',
      },
    };
  }

  static medicationReminder(
    patientName: string,
    medicationName: string,
    dosage: string,
  ): NotificationTemplate {
    return {
      title: 'Medication Reminder',
      body: `Hi ${patientName}, it's time to take ${medicationName} (${dosage}). Please take your medication as prescribed.`,
      data: {
        type: NotificationType.MEDICATION_REMINDER,
        action: 'view_medication',
      },
    };
  }

  static labResultAvailable(
    patientName: string,
    testName: string,
  ): NotificationTemplate {
    return {
      title: 'Lab Results Available',
      body: `Hi ${patientName}, your ${testName} results are now available. Please log in to view your results.`,
      data: {
        type: NotificationType.LAB_RESULT_AVAILABLE,
        action: 'view_results',
      },
    };
  }

  static missedAppointmentAlert(
    patientName: string,
    appointmentTime: string,
  ): NotificationTemplate {
    return {
      title: 'Missed Appointment',
      body: `Hi ${patientName}, you missed your appointment scheduled for ${appointmentTime}. Please reschedule at your earliest convenience.`,
      data: {
        type: NotificationType.MISSED_APPOINTMENT_ALERT,
        action: 'reschedule_appointment',
      },
    };
  }

  static emergencyBroadcast(message: string): NotificationTemplate {
    return {
      title: '🚨 Emergency Alert',
      body: message,
      data: {
        type: NotificationType.EMERGENCY_BROADCAST,
        action: 'view_emergency',
        priority: 'urgent',
      },
    };
  }

  /**
   * Clinician Notification Templates
   */

  static newPatientAssigned(
    clinicianName: string,
    patientName: string,
    patientId: string,
  ): NotificationTemplate {
    return {
      title: 'New Patient Assigned',
      body: `Hi ${clinicianName}, ${patientName} has been assigned to you. Please review their medical history.`,
      data: {
        type: NotificationType.NEW_PATIENT_ASSIGNED,
        action: 'view_patient',
        patientId,
      },
    };
  }

  static emergencyCaseAlert(
    clinicianName: string,
    patientName: string,
    severity: string,
    patientId: string,
  ): NotificationTemplate {
    return {
      title: '🚨 Emergency Case Alert',
      body: `Hi ${clinicianName}, ${patientName} requires immediate attention. Severity: ${severity}. Please respond immediately.`,
      data: {
        type: NotificationType.EMERGENCY_CASE_ALERT,
        action: 'view_emergency_case',
        patientId,
        severity,
        priority: 'urgent',
      },
    };
  }

  static criticalPatientUpdate(
    clinicianName: string,
    patientName: string,
    updateType: string,
    patientId: string,
  ): NotificationTemplate {
    return {
      title: 'Critical Patient Update',
      body: `Hi ${clinicianName}, critical update for ${patientName}: ${updateType}. Please review immediately.`,
      data: {
        type: NotificationType.CRITICAL_PATIENT_UPDATE,
        action: 'view_patient_update',
        patientId,
        updateType,
        priority: 'urgent',
      },
    };
  }

  /**
   * System Notification Templates
   */

  static systemAlert(message: string): NotificationTemplate {
    return {
      title: 'System Alert',
      body: message,
      data: {
        type: NotificationType.SYSTEM_ALERT,
        action: 'view_alert',
      },
    };
  }

  static maintenanceAlert(
    startTime: string,
    endTime: string,
    reason: string,
  ): NotificationTemplate {
    return {
      title: 'Scheduled Maintenance',
      body: `System maintenance scheduled from ${startTime} to ${endTime}. Reason: ${reason}. The app may be unavailable during this time.`,
      data: {
        type: NotificationType.MAINTENANCE_ALERT,
        action: 'view_maintenance',
        startTime,
        endTime,
      },
    };
  }

  static updateAvailable(version: string): NotificationTemplate {
    return {
      title: 'Update Available',
      body: `A new version (${version}) of Safe Mother Malawi is available. Please update to get the latest features and improvements.`,
      data: {
        type: NotificationType.UPDATE_AVAILABLE,
        action: 'update_app',
        version,
      },
    };
  }

  /**
   * General Notification Templates
   */

  static info(title: string, message: string): NotificationTemplate {
    return {
      title,
      body: message,
      data: {
        type: NotificationType.INFO,
      },
    };
  }

  static warning(title: string, message: string): NotificationTemplate {
    return {
      title,
      body: message,
      data: {
        type: NotificationType.WARNING,
      },
    };
  }

  static error(title: string, message: string): NotificationTemplate {
    return {
      title,
      body: message,
      data: {
        type: NotificationType.ERROR,
      },
    };
  }

  /**
   * Utility method to get template by type
   */
  static getTemplate(
    type: NotificationType,
    params: Record<string, any>,
  ): NotificationTemplate {
    switch (type) {
      case NotificationType.APPOINTMENT_REMINDER:
        return this.appointmentReminder(
          params.patientName,
          params.appointmentTime,
          params.clinicName,
        );

      case NotificationType.MEDICATION_REMINDER:
        return this.medicationReminder(
          params.patientName,
          params.medicationName,
          params.dosage,
        );

      case NotificationType.LAB_RESULT_AVAILABLE:
        return this.labResultAvailable(params.patientName, params.testName);

      case NotificationType.MISSED_APPOINTMENT_ALERT:
        return this.missedAppointmentAlert(
          params.patientName,
          params.appointmentTime,
        );

      case NotificationType.EMERGENCY_BROADCAST:
        return this.emergencyBroadcast(params.message);

      case NotificationType.NEW_PATIENT_ASSIGNED:
        return this.newPatientAssigned(
          params.clinicianName,
          params.patientName,
          params.patientId,
        );

      case NotificationType.EMERGENCY_CASE_ALERT:
        return this.emergencyCaseAlert(
          params.clinicianName,
          params.patientName,
          params.severity,
          params.patientId,
        );

      case NotificationType.CRITICAL_PATIENT_UPDATE:
        return this.criticalPatientUpdate(
          params.clinicianName,
          params.patientName,
          params.updateType,
          params.patientId,
        );

      case NotificationType.SYSTEM_ALERT:
        return this.systemAlert(params.message);

      case NotificationType.MAINTENANCE_ALERT:
        return this.maintenanceAlert(
          params.startTime,
          params.endTime,
          params.reason,
        );

      case NotificationType.UPDATE_AVAILABLE:
        return this.updateAvailable(params.version);

      case NotificationType.INFO:
        return this.info(params.title, params.message);

      case NotificationType.WARNING:
        return this.warning(params.title, params.message);

      case NotificationType.ERROR:
        return this.error(params.title, params.message);

      default:
        return this.info('Notification', 'You have a new notification');
    }
  }
}
