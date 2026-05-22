/**
 * Notification Types for Safe Mother Malawi
 * Categorized by recipient type and urgency
 */

export enum NotificationType {
  // Patient Notifications
  APPOINTMENT_REMINDER = 'appointment_reminder',
  MEDICATION_REMINDER = 'medication_reminder',
  LAB_RESULT_AVAILABLE = 'lab_result_available',
  MISSED_APPOINTMENT_ALERT = 'missed_appointment_alert',
  EMERGENCY_BROADCAST = 'emergency_broadcast',

  // Clinician Notifications
  NEW_PATIENT_ASSIGNED = 'new_patient_assigned',
  EMERGENCY_CASE_ALERT = 'emergency_case_alert',
  CRITICAL_PATIENT_UPDATE = 'critical_patient_update',

  // System Notifications
  SYSTEM_ALERT = 'system_alert',
  MAINTENANCE_ALERT = 'maintenance_alert',
  UPDATE_AVAILABLE = 'update_available',

  // General
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationRecipient {
  PATIENT = 'patient',
  CLINICIAN = 'clinician',
  ADMIN = 'admin',
  ALL = 'all',
}

/**
 * Notification type configuration
 */
export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    title: string;
    description: string;
    priority: NotificationPriority;
    recipient: NotificationRecipient;
    requiresAction: boolean;
    icon: string;
    color: string;
  }
> = {
  // Patient Notifications
  [NotificationType.APPOINTMENT_REMINDER]: {
    title: 'Appointment Reminder',
    description: 'Reminder for upcoming appointment',
    priority: NotificationPriority.NORMAL,
    recipient: NotificationRecipient.PATIENT,
    requiresAction: true,
    icon: 'calendar',
    color: '#2196F3',
  },
  [NotificationType.MEDICATION_REMINDER]: {
    title: 'Medication Reminder',
    description: 'Time to take your medication',
    priority: NotificationPriority.HIGH,
    recipient: NotificationRecipient.PATIENT,
    requiresAction: true,
    icon: 'pill',
    color: '#FF9800',
  },
  [NotificationType.LAB_RESULT_AVAILABLE]: {
    title: 'Lab Results Available',
    description: 'Your lab results are ready',
    priority: NotificationPriority.HIGH,
    recipient: NotificationRecipient.PATIENT,
    requiresAction: true,
    icon: 'flask',
    color: '#4CAF50',
  },
  [NotificationType.MISSED_APPOINTMENT_ALERT]: {
    title: 'Missed Appointment',
    description: 'You missed your appointment',
    priority: NotificationPriority.HIGH,
    recipient: NotificationRecipient.PATIENT,
    requiresAction: true,
    icon: 'alert',
    color: '#F44336',
  },
  [NotificationType.EMERGENCY_BROADCAST]: {
    title: 'Emergency Alert',
    description: 'Important emergency information',
    priority: NotificationPriority.URGENT,
    recipient: NotificationRecipient.PATIENT,
    requiresAction: true,
    icon: 'warning',
    color: '#D32F2F',
  },

  // Clinician Notifications
  [NotificationType.NEW_PATIENT_ASSIGNED]: {
    title: 'New Patient Assigned',
    description: 'A new patient has been assigned to you',
    priority: NotificationPriority.NORMAL,
    recipient: NotificationRecipient.CLINICIAN,
    requiresAction: true,
    icon: 'person-add',
    color: '#2196F3',
  },
  [NotificationType.EMERGENCY_CASE_ALERT]: {
    title: 'Emergency Case Alert',
    description: 'Emergency case requires immediate attention',
    priority: NotificationPriority.URGENT,
    recipient: NotificationRecipient.CLINICIAN,
    requiresAction: true,
    icon: 'emergency',
    color: '#D32F2F',
  },
  [NotificationType.CRITICAL_PATIENT_UPDATE]: {
    title: 'Critical Patient Update',
    description: 'Critical update for your patient',
    priority: NotificationPriority.URGENT,
    recipient: NotificationRecipient.CLINICIAN,
    requiresAction: true,
    icon: 'heart-alert',
    color: '#F44336',
  },

  // System Notifications
  [NotificationType.SYSTEM_ALERT]: {
    title: 'System Alert',
    description: 'Important system notification',
    priority: NotificationPriority.HIGH,
    recipient: NotificationRecipient.ALL,
    requiresAction: false,
    icon: 'info',
    color: '#FF9800',
  },
  [NotificationType.MAINTENANCE_ALERT]: {
    title: 'Maintenance Alert',
    description: 'System maintenance scheduled',
    priority: NotificationPriority.NORMAL,
    recipient: NotificationRecipient.ALL,
    requiresAction: false,
    icon: 'wrench',
    color: '#9C27B0',
  },
  [NotificationType.UPDATE_AVAILABLE]: {
    title: 'Update Available',
    description: 'New app update is available',
    priority: NotificationPriority.NORMAL,
    recipient: NotificationRecipient.ALL,
    requiresAction: false,
    icon: 'download',
    color: '#2196F3',
  },

  // General
  [NotificationType.INFO]: {
    title: 'Information',
    description: 'General information',
    priority: NotificationPriority.LOW,
    recipient: NotificationRecipient.ALL,
    requiresAction: false,
    icon: 'info',
    color: '#2196F3',
  },
  [NotificationType.WARNING]: {
    title: 'Warning',
    description: 'Warning notification',
    priority: NotificationPriority.HIGH,
    recipient: NotificationRecipient.ALL,
    requiresAction: false,
    icon: 'warning',
    color: '#FF9800',
  },
  [NotificationType.ERROR]: {
    title: 'Error',
    description: 'Error notification',
    priority: NotificationPriority.HIGH,
    recipient: NotificationRecipient.ALL,
    requiresAction: false,
    icon: 'error',
    color: '#F44336',
  },
};
