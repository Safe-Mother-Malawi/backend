import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { IvrCallLogService } from './ivr-call-log.service';
import { IvrMenuAction } from './entities/ivr-call-log.entity';
import { IvrAlertsGateway, IvrAlert } from './ivr-alerts.gateway';
import { AlertsService } from '../alerts/alerts.service';
import { AlertSeverity } from '../alerts/entities/alert.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UserRole } from '../users/entities/user.entity';
import { IvrLanguageService } from './services/ivr-language.service';
import { IvrLanguage, IvrMessages } from './config/ivr-messages.i18n';

/**
 * IVR Simulator Service
 * 
 * Handles IVR flow logic for the Flutter simulator.
 * Processes digit inputs and returns appropriate responses.
 * Supports multi-language: English, Chichewa, Tumbuka
 */

interface SimulatorSession {
  sessionId: string;
  currentMenu: string;
  responses: string[];
  riskScore: number;
  patientType?: 'prenatal' | 'neonatal';
  language: IvrLanguage; // Language for this session
  answers: Record<string, string>;
  criticalAlertsTriggered: Set<string>; // Track which questions triggered alerts to avoid duplicates
  
  // Patient identity
  callerPhone?: string;
  district?: string;
  healthFacility?: string;
  patientName?: string;
}

interface SimulatorResponse {
  message: string;
  nextMenu: string;
  action: string;
  riskLevel?: string;
  shouldHangup: boolean;
}

@Injectable()
export class IvrSimulatorService {
  private readonly logger = new Logger(IvrSimulatorService.name);
  private sessions = new Map<string, SimulatorSession>();

  constructor(
    private readonly callLog: IvrCallLogService,
    @Inject(forwardRef(() => IvrAlertsGateway))
    private readonly alertsGateway: IvrAlertsGateway,
    @Inject(forwardRef(() => AlertsService))
    private readonly alertsService: AlertsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly languageService: IvrLanguageService,
  ) {}

  /**
   * Initialize a new simulator session
   */
  initializeSession(
    sessionId: string,
    language?: IvrLanguage,
    callerPhone?: string,
    district?: string,
    healthFacility?: string,
    patientName?: string,
  ): SimulatorSession {
    const lang = this.languageService.validateLanguage(language);
    const session: SimulatorSession = {
      sessionId,
      currentMenu: 'welcome',
      responses: [],
      riskScore: 0,
      language: lang,
      answers: {},
      criticalAlertsTriggered: new Set(),
      
      // Patient identity
      callerPhone,
      district,
      healthFacility,
      patientName,
    };
    this.sessions.set(sessionId, session);
    
    // Log session start with patient info
    this.callLog.log({
      sessionId,
      callerPhone: callerPhone || `sim-${sessionId}`,
      district,
      healthCentre: healthFacility,
      patientName,
      action: IvrMenuAction.CALL_START,
    });
    
    this.logger.log(
      `Simulator session initialized: ${sessionId} (Language: ${lang}, Phone: ${callerPhone}, District: ${district})`,
    );
    return session;
  }

  /**
   * Get or create a session
   */
  getSession(sessionId: string): SimulatorSession {
    if (!this.sessions.has(sessionId)) {
      return this.initializeSession(sessionId);
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Process digit input and return response
   */
  async processDigit(sessionId: string, digit: string): Promise<SimulatorResponse> {
    const session = this.getSession(sessionId);

    this.logger.log(
      `Processing digit: ${digit} for session: ${sessionId} at menu: ${session.currentMenu}`,
    );

    let response: SimulatorResponse;

    switch (session.currentMenu) {
      case 'welcome':
        response = this.handleWelcomeMenu(session, digit);
        break;
      case 'main_menu':
        response = this.handleMainMenu(session, digit);
        break;
      case 'symptom_type':
        response = this.handleSymptomType(session, digit);
        break;
      case 'prenatal_q1':
      case 'prenatal_q2':
      case 'prenatal_q3':
      case 'prenatal_q4':
      case 'prenatal_q5':
        response = this.handlePrenatalQuestion(session, digit);
        break;
      case 'neonatal_q1':
      case 'neonatal_q2':
      case 'neonatal_q3':
      case 'neonatal_q4':
      case 'neonatal_q5':
        response = this.handleNeonatalQuestion(session, digit);
        break;
      case 'risk_result':
        response = await this.handleRiskResult(session, digit);
        break;
      case 'appointment_check':
        response = this.handleAppointmentCheck(session, digit);
        break;
      case 'health_tips':
        response = this.handleHealthTips(session, digit);
        break;
      case 'emergency_contacts':
        response = this.handleEmergencyContacts(session, digit);
        break;
      default:
        response = {
          message: 'Invalid menu state. Returning to main menu.',
          nextMenu: 'main_menu',
          action: 'MAIN_MENU',
          shouldHangup: false,
        };
    }

    session.currentMenu = response.nextMenu;
    session.responses.push(response.message);

    // Log interaction
    this.callLog.log({
      sessionId,
      callerPhone: `sim-${sessionId}`,
      action: response.action as IvrMenuAction,
      digitPressed: digit,
      questionText: response.message,
      riskScore: session.riskScore,
      riskCategory: response.riskLevel,
    });

    return response;
  }

  /**
   * Welcome menu handler
   */
  private handleWelcomeMenu(session: SimulatorSession, digit: string): SimulatorResponse {
    if (digit === '1') {
      return {
        message: this.languageService.getMessage('mainMenu', session.language),
        nextMenu: 'main_menu',
        action: 'MAIN_MENU',
        shouldHangup: false,
      };
    }
    return {
      message: this.languageService.getMessage('welcome', session.language),
      nextMenu: 'welcome',
      action: 'WELCOME',
      shouldHangup: false,
    };
  }

  /**
   * Main menu handler
   */
  private handleMainMenu(session: SimulatorSession, digit: string): SimulatorResponse {
    switch (digit) {
      case '1':
        return {
          message: this.languageService.getMessage('symptomChecker', session.language),
          nextMenu: 'symptom_type',
          action: 'SYMPTOM_TYPE',
          shouldHangup: false,
        };
      case '2':
        return {
          message: this.languageService.getMessage('appointmentCheck', session.language),
          nextMenu: 'appointment_check',
          action: 'APPOINTMENT_CHECK',
          shouldHangup: false,
        };
      case '3':
        return {
          message: this.languageService.getMessage('healthTips', session.language),
          nextMenu: 'health_tips',
          action: 'HEALTH_TIPS',
          shouldHangup: false,
        };
      case '4':
        return {
          message: this.languageService.getMessage('clinicianConnect', session.language),
          nextMenu: 'main_menu',
          action: 'CLINICIAN_CONNECT',
          shouldHangup: true,
        };
      case '0':
        return {
          message: this.languageService.getMessage('emergency', session.language),
          nextMenu: 'emergency_contacts',
          action: 'EMERGENCY',
          shouldHangup: false,
        };
      default:
        return {
          message: this.languageService.getMessage('invalidOption', session.language),
          nextMenu: 'main_menu',
          action: 'MAIN_MENU',
          shouldHangup: false,
        };
    }
  }

  /**
   * Symptom type handler (prenatal vs neonatal)
   */
  private handleSymptomType(session: SimulatorSession, digit: string): SimulatorResponse {
    switch (digit) {
      case '1':
        session.patientType = 'prenatal';
        return {
          message: this.languageService.getMessage('prenatalQ1', session.language),
          nextMenu: 'prenatal_q1',
          action: 'PRENATAL_Q1',
          shouldHangup: false,
        };
      case '2':
        session.patientType = 'neonatal';
        return {
          message: this.languageService.getMessage('neonatalQ1', session.language),
          nextMenu: 'neonatal_q1',
          action: 'NEONATAL_Q1',
          shouldHangup: false,
        };
      default:
        return {
          message: this.languageService.getMessage('symptomChecker', session.language),
          nextMenu: 'symptom_type',
          action: 'SYMPTOM_TYPE',
          shouldHangup: false,
        };
    }
  }

  /**
   * Prenatal question handler
   */
  private handlePrenatalQuestion(session: SimulatorSession, digit: string): SimulatorResponse {
    const questionMap: Record<string, { field: string; nextMenu: string; messageKey: keyof IvrMessages; scoreMap: Record<string, number> }> = {
      prenatal_q1: {
        field: 'wellbeing',
        nextMenu: 'prenatal_q2',
        messageKey: 'prenatalQ2',
        scoreMap: { '1': 0, '2': 1, '3': 3, '4': 5 },
      },
      prenatal_q2: {
        field: 'headache',
        nextMenu: 'prenatal_q3',
        messageKey: 'prenatalQ3',
        scoreMap: { '1': 0, '2': 2, '3': 5, '4': 7 },
      },
      prenatal_q3: {
        field: 'swelling',
        nextMenu: 'prenatal_q4',
        messageKey: 'prenatalQ4',
        scoreMap: { '1': 0, '2': 3, '3': 5, '4': 7 },
      },
      prenatal_q4: {
        field: 'fetalMovement',
        nextMenu: 'prenatal_q5',
        messageKey: 'prenatalQ5',
        scoreMap: { '1': 0, '2': 3, '3': 7 },
      },
      prenatal_q5: {
        field: 'bleeding',
        nextMenu: 'risk_result',
        messageKey: 'prenatalComplete',
        scoreMap: { '1': 0, '2': 3, '3': 8, '4': 4 },
      },
    };

    const q = questionMap[session.currentMenu];
    if (!q) {
      return {
        message: this.languageService.getMessage('errorAssessment', session.language),
        nextMenu: 'main_menu',
        action: 'ERROR',
        shouldHangup: false,
      };
    }

    // Score the answer
    const score = q.scoreMap[digit] ?? 0;
    session.riskScore += score;
    session.answers[q.field] = digit;

    // Check for critical answer and trigger immediate alert
    this.checkAndTriggerCriticalAnswerAlert(session, q.field, score, digit);

    if (session.currentMenu === 'prenatal_q5') {
      return {
        message: this.languageService.getMessage(q.messageKey, session.language),
        nextMenu: q.nextMenu,
        action: 'PRENATAL_COMPLETE',
        shouldHangup: false,
      };
    }

    return {
      message: this.languageService.getMessage(q.messageKey, session.language),
      nextMenu: q.nextMenu,
      action: 'PRENATAL_QUESTION',
      shouldHangup: false,
    };
  }

  /**
   * Neonatal question handler
   */
  private handleNeonatalQuestion(session: SimulatorSession, digit: string): SimulatorResponse {
    const questionMap: Record<string, { field: string; nextMenu: string; messageKey: keyof IvrMessages; scoreMap: Record<string, number> }> = {
      neonatal_q1: {
        field: 'breathing',
        nextMenu: 'neonatal_q2',
        messageKey: 'neonatalQ2',
        scoreMap: { '1': 0, '2': 3, '3': 6 },
      },
      neonatal_q2: {
        field: 'feeding',
        nextMenu: 'neonatal_q3',
        messageKey: 'neonatalQ3',
        scoreMap: { '1': 0, '2': 3, '3': 6 },
      },
      neonatal_q3: {
        field: 'skinColor',
        nextMenu: 'neonatal_q4',
        messageKey: 'neonatalQ4',
        scoreMap: { '1': 0, '2': 2, '3': 5 },
      },
      neonatal_q4: {
        field: 'temperature',
        nextMenu: 'neonatal_q5',
        messageKey: 'neonatalQ5',
        scoreMap: { '1': 0, '2': 3, '3': 6 },
      },
      neonatal_q5: {
        field: 'activity',
        nextMenu: 'risk_result',
        messageKey: 'neonatalComplete',
        scoreMap: { '1': 0, '2': 3, '3': 6 },
      },
    };

    const q = questionMap[session.currentMenu];
    if (!q) {
      return {
        message: this.languageService.getMessage('errorAssessment', session.language),
        nextMenu: 'main_menu',
        action: 'ERROR',
        shouldHangup: false,
      };
    }

    const score = q.scoreMap[digit] ?? 0;
    session.riskScore += score;
    session.answers[q.field] = digit;

    // Check for critical answer and trigger immediate alert
    this.checkAndTriggerCriticalAnswerAlert(session, q.field, score, digit);

    if (session.currentMenu === 'neonatal_q5') {
      return {
        message: this.languageService.getMessage(q.messageKey, session.language),
        nextMenu: q.nextMenu,
        action: 'NEONATAL_COMPLETE',
        shouldHangup: false,
      };
    }

    return {
      message: this.languageService.getMessage(q.messageKey, session.language),
      nextMenu: q.nextMenu,
      action: 'NEONATAL_QUESTION',
      shouldHangup: false,
    };
  }

  /**
   * Risk result handler
   */
  private async handleRiskResult(session: SimulatorSession, digit: string): Promise<SimulatorResponse> {
    const riskLevel = this.calculateRiskLevel(session.riskScore);

    let message = `${this.languageService.getMessage('riskAssessmentComplete', session.language)}${riskLevel}. `;

    if (riskLevel === 'CRITICAL') {
      message += this.languageService.getMessage('criticalRisk', session.language);
    } else if (riskLevel === 'HIGH') {
      message += this.languageService.getMessage('highRisk', session.language);
    } else if (riskLevel === 'MODERATE') {
      message += this.languageService.getMessage('moderateRisk', session.language);
    } else {
      message += this.languageService.getMessage('lowRisk', session.language);
    }

    message += ` ${this.languageService.getMessage('returnToMenu', session.language)}`;

    // Create alert in database if HIGH or CRITICAL risk
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      try {
        const severity = riskLevel === 'CRITICAL' ? AlertSeverity.CRITICAL : AlertSeverity.HIGH;
        const patientType = session.patientType || 'prenatal';
        
        // Build symptoms list from answers
        const symptoms = Object.entries(session.answers)
          .map(([key, value]) => `${key}: ${value}`)
          .slice(0, 5);

        // Use patient identity for routing, or fallback to random facility for demo
        let facility = session.healthFacility;
        let district = session.district;
        
        if (!facility || !district) {
          // Fallback for demo
          const facilities = ['Lilongwe Health Centre', 'Blantyre District Hospital', 'Mzuzu Central Hospital'];
          facility = facilities[Math.floor(Math.random() * facilities.length)];
          const districts = ['Lilongwe', 'Blantyre', 'Mzuzu'];
          district = districts[Math.floor(Math.random() * districts.length)];
        }

        // Create alert in database with patient identity and facility routing
        await this.alertsService.createFromRisk({
          patientName: session.patientName || `IVR Patient (${patientType})`,
          patientStatus: patientType,
          contact: session.callerPhone || `sim-${session.sessionId}`,
          reason: `${riskLevel} risk detected via IVR assessment (Score: ${session.riskScore})`,
          symptoms,
          severity,
          patientId: null,
          clinicianId: null,
          facilityName: facility,
          district: district,
        });

        this.logger.log(
          `Alert created: ${riskLevel} risk for ${session.patientName || 'Unknown'} (${session.callerPhone}) routed to ${facility}, ${district}`,
        );
      } catch (error) {
        this.logger.error(`Failed to create alert: ${error}`);
      }

      // Emit WebSocket alert to connected clinicians
      const alert: IvrAlert = {
        sessionId: session.sessionId,
        timestamp: new Date(),
        riskLevel: riskLevel as 'HIGH' | 'CRITICAL',
        patientType: session.patientType || 'prenatal',
        callerPhone: session.callerPhone || `sim-${session.sessionId}`,
        message: `${riskLevel} Risk Alert: ${session.patientType} patient (${session.callerPhone}) needs attention`,
        answers: session.answers,
        riskScore: session.riskScore,
        action: 'RISK_ALERT',
      };

      this.alertsGateway.broadcastAlert(alert);
      this.logger.log(
        `Alert broadcast: ${riskLevel} risk for ${session.patientName || 'Unknown'} (${session.callerPhone})`,
      );

      // Create notification for all clinicians
      try {
        const emoji = riskLevel === 'CRITICAL' ? '🚨' : '⚠️';
        const patientTypeDisplay = session.patientType 
          ? session.patientType.charAt(0).toUpperCase() + session.patientType.slice(1)
          : 'Patient';
        const patientInfo = session.patientName ? ` - ${session.patientName}` : '';
        const phoneInfo = session.callerPhone ? ` (${session.callerPhone})` : '';
        
        await this.notificationsService.notifyClinicians(
          `${emoji} ${riskLevel} Risk Alert`,
          `${patientTypeDisplay}${patientInfo}${phoneInfo} assessment complete. Risk Level: ${riskLevel} (Score: ${session.riskScore}). Immediate attention required.`,
          NotificationType.ALERT,
        );
        this.logger.log(`${riskLevel} risk notification sent to all clinicians`);
      } catch (error) {
        this.logger.error(`Failed to create risk notification: ${error}`);
      }
    }

    return {
      message,
      nextMenu: 'main_menu',
      action: 'RISK_RESULT',
      riskLevel,
      shouldHangup: digit === '0',
    };
  }

  /**
   * Appointment check handler
   */
  private handleAppointmentCheck(session: SimulatorSession, digit: string): SimulatorResponse {
    return {
      message: this.languageService.getMessage('appointmentInfo', session.language),
      nextMenu: 'main_menu',
      action: 'APPOINTMENT_CHECK',
      shouldHangup: false,
    };
  }

  /**
   * Health tips handler
   */
  private handleHealthTips(session: SimulatorSession, digit: string): SimulatorResponse {
    const tipKeys: (keyof IvrMessages)[] = [
      'healthTip1',
      'healthTip2',
      'healthTip3',
      'healthTip4',
      'healthTip5',
    ];

    const tipKey = tipKeys[Math.floor(Math.random() * tipKeys.length)];
    const tip = this.languageService.getMessage(tipKey, session.language);

    return {
      message: `${this.languageService.getMessage('anotherTip', session.language)}${tip}. ${this.languageService.getMessage('healthTips', session.language)}`,
      nextMenu: 'health_tips',
      action: 'HEALTH_TIPS',
      shouldHangup: false,
    };
  }

  /**
   * Emergency contacts handler
   */
  private handleEmergencyContacts(session: SimulatorSession, digit: string): SimulatorResponse {
    return {
      message: this.languageService.getMessage('emergencyContacts', session.language),
      nextMenu: 'emergency_contacts',
      action: 'EMERGENCY',
      shouldHangup: false,
    };
  }

  /**
   * Check if an answer is critical and trigger immediate alert
   * Critical thresholds:
   * - Prenatal: score >= 5 (severe symptoms)
   * - Neonatal: score >= 4 (severe symptoms)
   */
  private async checkAndTriggerCriticalAnswerAlert(
    session: SimulatorSession,
    field: string,
    score: number,
    digit: string,
  ): Promise<void> {
    // Determine if this is a critical answer
    const isCritical = session.patientType === 'prenatal' ? score >= 5 : score >= 4;

    if (!isCritical) {
      return; // Not critical, skip alert
    }

    // Avoid duplicate alerts for the same question
    if (session.criticalAlertsTriggered.has(field)) {
      return;
    }

    session.criticalAlertsTriggered.add(field);

    try {
      // Create immediate alert in database with patient identity
      const severity = AlertSeverity.HIGH; // Critical answers trigger HIGH severity alerts
      const patientType = session.patientType || 'prenatal';

      // Use patient identity for routing
      let facility = session.healthFacility;
      let district = session.district;
      
      if (!facility || !district) {
        // Fallback for demo
        const facilities = ['Lilongwe Health Centre', 'Blantyre District Hospital', 'Mzuzu Central Hospital'];
        facility = facilities[Math.floor(Math.random() * facilities.length)];
        const districts = ['Lilongwe', 'Blantyre', 'Mzuzu'];
        district = districts[Math.floor(Math.random() * districts.length)];
      }

      await this.alertsService.createFromRisk({
        patientName: session.patientName || `IVR Patient (${patientType}) - Critical Answer`,
        patientStatus: patientType,
        contact: session.callerPhone || `sim-${session.sessionId}`,
        reason: `CRITICAL ANSWER detected during IVR assessment: ${field} (Score: ${score}). Patient still in call.`,
        symptoms: [`${field}: ${digit} (score: ${score})`],
        severity,
        patientId: null,
        clinicianId: null,
        facilityName: facility,
        district: district,
      });

      this.logger.log(
        `Critical answer alert created: ${field} (score: ${score}) for ${session.patientName || 'Unknown'} (${session.callerPhone})`,
      );
    } catch (error) {
      this.logger.error(`Failed to create critical answer alert: ${error}`);
    }

    // Emit WebSocket alert to connected clinicians
    const alert: IvrAlert = {
      sessionId: session.sessionId,
      timestamp: new Date(),
      riskLevel: 'HIGH',
      patientType: session.patientType || 'prenatal',
      callerPhone: session.callerPhone || `sim-${session.sessionId}`,
      message: `⚠️ CRITICAL ANSWER: ${session.patientType} patient (${session.callerPhone}) reported severe ${field}. Patient still in call.`,
      answers: { [field]: digit, ...session.answers },
      riskScore: score,
      action: 'CRITICAL_ANSWER_ALERT',
    };

    this.alertsGateway.broadcastAlert(alert);
    this.logger.log(
      `Critical answer alert broadcast: ${field} (score: ${score}) for ${session.patientName || 'Unknown'} (${session.callerPhone})`,
    );

    // Create notification for all clinicians
    try {
      const patientTypeDisplay = session.patientType 
        ? session.patientType.charAt(0).toUpperCase() + session.patientType.slice(1)
        : 'Patient';
      const patientInfo = session.patientName ? ` - ${session.patientName}` : '';
      const phoneInfo = session.callerPhone ? ` (${session.callerPhone})` : '';
      
      await this.notificationsService.notifyClinicians(
        `⚠️ Critical Answer Alert`,
        `${patientTypeDisplay}${patientInfo}${phoneInfo} reported severe ${field} (Score: ${score}). Patient still in call.`,
        NotificationType.ALERT,
      );
      this.logger.log(`Critical answer notification sent to all clinicians`);
    } catch (error) {
      this.logger.error(`Failed to create critical answer notification: ${error}`);
    }
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(score: number): string {
    if (score >= 20) return 'CRITICAL';
    if (score >= 15) return 'HIGH';
    if (score >= 8) return 'MODERATE';
    return 'LOW';
  }

  /**
   * End session and cleanup
   */
  endSession(sessionId: string): void {
    // Log session end
    this.callLog.log({
      sessionId,
      callerPhone: `sim-${sessionId}`,
      action: IvrMenuAction.CALL_END,
    });
    
    this.sessions.delete(sessionId);
    this.logger.log(`Session ended: ${sessionId}`);
  }

  /**
   * Get session summary
   */
  getSessionSummary(sessionId: string) {
    const session = this.getSession(sessionId);
    return {
      sessionId,
      patientType: session.patientType,
      riskScore: session.riskScore,
      riskLevel: this.calculateRiskLevel(session.riskScore),
      answers: session.answers,
      responseCount: session.responses.length,
    };
  }
}
