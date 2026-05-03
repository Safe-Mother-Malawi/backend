// placeholder
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IvrSessionStore, IvrSession } from './ivr-session.store';
import { RiskEngineService, RiskEngineInput, RiskCategory } from '../risk-engine/risk-engine.service';
import { PatientsService } from '../patients/patients.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { RiskAssessmentsService } from '../risk-assessments/risk-assessments.service';
import { PatientType } from '../risk-assessments/entities/risk-assessment.entity';
import { IvrCallLogService } from './ivr-call-log.service';
import { IvrMenuAction, IvrCallOutcome } from './entities/ivr-call-log.entity';

// ── VXML helpers ──────────────────────────────────────────────────────────────

function say(text: string): string {
  return `<Say voice="woman">${text}</Say>`;
}
function getDigits(prompt: string, numDigits = 1, timeout = 5): string {
  return `<GetDigits timeout="${timeout}" numDigits="${numDigits}" finishOnKey="#">\n    ${say(prompt)}\n  </GetDigits>`;
}
function hangup(msg = 'Thank you for calling Safe Mother Malawi. Goodbye.'): string {
  return `<Say voice="woman">${msg}</Say>`;
}
function vxml(...nodes: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  ${nodes.join('\n  ')}\n</Response>`;
}

// ── Symptom question definitions ──────────────────────────────────────────────

interface SymptomQuestion {
  menu: IvrSession['menu'];
  next: IvrSession['menu'];
  field: string;
  prompt: string;
  scoreMap: Record<string, number>;
}

const PRENATAL_QUESTIONS: SymptomQuestion[] = [
  {
    menu: 'symptom_prenatal_wellbeing', next: 'symptom_prenatal_headache', field: 'generalWellbeing',
    prompt: 'How are you feeling today? Press 1 for very well. Press 2 if you feel tired. Press 3 if you feel unwell. Press 4 if you are in pain.',
    scoreMap: { '1': 0, '2': 1, '3': 3, '4': 5 },
  },
  {
    menu: 'symptom_prenatal_headache', next: 'symptom_prenatal_swelling', field: 'headache',
    prompt: 'Do you have a headache? Press 1 for no headache. Press 2 for mild headache. Press 3 for severe headache. Press 4 for severe headache with blurred vision.',
    scoreMap: { '1': 0, '2': 1, '3': 4, '4': 6 },
  },
  {
    menu: 'symptom_prenatal_swelling', next: 'symptom_prenatal_fetal', field: 'swelling',
    prompt: 'Do you have swelling? Press 1 for no swelling. Press 2 for mild swelling of feet. Press 3 for swelling of hands and face. Press 4 for sudden severe swelling.',
    scoreMap: { '1': 0, '2': 2, '3': 5, '4': 7 },
  },
  {
    menu: 'symptom_prenatal_fetal', next: 'symptom_prenatal_bleeding', field: 'fetalMovement',
    prompt: 'Is your baby moving? Press 1 if baby is moving normally. Press 2 if baby is moving less than usual. Press 3 if baby has not moved today.',
    scoreMap: { '1': 0, '2': 3, '3': 7 },
  },
  {
    menu: 'symptom_prenatal_bleeding', next: 'risk_result', field: 'bleedingDischarge',
    prompt: 'Do you have any bleeding or unusual discharge? Press 1 for none. Press 2 for light spotting. Press 3 for heavy bleeding. Press 4 for unusual discharge.',
    scoreMap: { '1': 0, '2': 3, '3': 8, '4': 4 },
  },
];

const NEONATAL_QUESTIONS: SymptomQuestion[] = [
  {
    menu: 'symptom_neonatal_breathing', next: 'symptom_neonatal_feeding', field: 'breathing',
    prompt: 'How is your baby breathing? Press 1 for normal breathing. Press 2 for fast breathing. Press 3 for very fast or noisy breathing.',
    scoreMap: { '1': 0, '2': 3, '3': 6 },
  },
  {
    menu: 'symptom_neonatal_feeding', next: 'symptom_neonatal_skin', field: 'feeding',
    prompt: 'How is your baby feeding? Press 1 if feeding well. Press 2 if feeding poorly. Press 3 if not feeding at all.',
    scoreMap: { '1': 0, '2': 3, '3': 6 },
  },
  {
    menu: 'symptom_neonatal_skin', next: 'symptom_neonatal_temp', field: 'skinColor',
    prompt: "What is your baby's skin colour? Press 1 for normal. Press 2 for pale or yellowish. Press 3 for blue or very yellow.",
    scoreMap: { '1': 0, '2': 2, '3': 5 },
  },
  {
    menu: 'symptom_neonatal_temp', next: 'symptom_neonatal_activity', field: 'temperature',
    prompt: 'Does your baby have a fever or feel cold? Press 1 for normal temperature. Press 2 for mild fever. Press 3 for high fever or very cold.',
    scoreMap: { '1': 0, '2': 3, '3': 6 },
  },
  {
    menu: 'symptom_neonatal_activity', next: 'risk_result', field: 'activity',
    prompt: 'How active is your baby? Press 1 if active and alert. Press 2 if less active than usual. Press 3 if very sleepy or not responding.',
    scoreMap: { '1': 0, '2': 3, '3': 6 },
  },
];

const ALL_QUESTIONS = [...PRENATAL_QUESTIONS, ...NEONATAL_QUESTIONS];

const MAIN_MENU_PROMPT =
  'Press 1 to check your health symptoms. ' +
  'Press 2 to hear your next appointment. ' +
  'Press 3 for health tips. ' +
  'Press 0 for emergency contacts.';


@Injectable()
export class IvrService {
  private readonly logger = new Logger(IvrService.name);

  constructor(
    private readonly sessionStore: IvrSessionStore,
    private readonly riskEngine: RiskEngineService,
    private readonly patientsService: PatientsService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
    @Inject(forwardRef(() => RiskAssessmentsService))
    private readonly riskAssessmentsService: RiskAssessmentsService,
    private readonly callLog: IvrCallLogService,
    private readonly config: ConfigService,
  ) {}

  // ── Entry point ───────────────────────────────────────────────────────────

  async handleCall(params: {
    sessionId: string;
    callerNumber: string;
    dtmfDigits?: string;
    isActive?: string;
  }): Promise<string> {
    const phone = this.normalisePhone(params.callerNumber);
    const digit = (params.dtmfDigits ?? '').trim();

    if (params.isActive === '0') {
      const session = this.sessionStore.get(phone);
      this.callLog.log({
        sessionId: params.sessionId, callerPhone: phone,
        patientId: session?.patientId, patientName: session?.patientName,
        patientType: session?.patientType,
        action: IvrMenuAction.CALL_END, outcome: this.deriveOutcome(session),
      });
      this.sessionStore.destroy(phone);
      return vxml(hangup());
    }

    const session = this.sessionStore.getOrCreate(phone);

    if (!digit && session.menu === 'welcome') {
      this.callLog.log({ sessionId: params.sessionId, callerPhone: phone, action: IvrMenuAction.CALL_START });
      this.sessionStore.update(phone, { sessionId: params.sessionId });
      return this.handleWelcome(session);
    }

    if (!digit) {
      this.callLog.log({
        sessionId: params.sessionId, callerPhone: phone,
        patientId: session.patientId, patientType: session.patientType,
        action: IvrMenuAction.TIMEOUT, menuKey: session.menu, isTimeout: true,
      });
      return this.repromptCurrentMenu(session);
    }

    return this.handleDigit(session, digit, params.sessionId);
  }

  // ── Welcome ───────────────────────────────────────────────────────────────

  private async handleWelcome(session: IvrSession): Promise<string> {
    await this.resolvePatient(session);
    const s = this.sessionStore.getOrCreate(session.phone);
    // Update call log with resolved patient info
    if (s.patientId) {
      this.callLog.log({
        sessionId: s.sessionId, callerPhone: s.phone,
        patientId: s.patientId, patientName: s.patientName, patientType: s.patientType,
        action: IvrMenuAction.MAIN_MENU, menuKey: 'welcome',
      });
    }
    const greeting = s.patientName
      ? `Welcome to Safe Mother Malawi. Hello ${s.patientName}.`
      : 'Welcome to Safe Mother Malawi.';
    this.sessionStore.update(s.phone, { menu: 'main_menu' });
    return vxml(getDigits(`${greeting} ${MAIN_MENU_PROMPT}`));
  }

  // ── Digit router ──────────────────────────────────────────────────────────

  private async handleDigit(session: IvrSession, digit: string, sessionId: string): Promise<string> {
    switch (session.menu) {
      case 'main_menu':               return this.handleMainMenu(session, digit, sessionId);
      case 'patient_type_select':     return this.handlePatientTypeSelect(session, digit);
      case 'symptom_prenatal_wellbeing':
      case 'symptom_prenatal_headache':
      case 'symptom_prenatal_swelling':
      case 'symptom_prenatal_fetal':
      case 'symptom_prenatal_bleeding':
      case 'symptom_neonatal_breathing':
      case 'symptom_neonatal_feeding':
      case 'symptom_neonatal_skin':
      case 'symptom_neonatal_temp':
      case 'symptom_neonatal_activity': return this.handleSymptomQuestion(session, digit, sessionId);
      case 'risk_result':             return this.handlePostResult(session, digit);
      case 'appointment_info':
      case 'health_tips':
      case 'emergency':               return this.handleReturnToMenu(session, digit);
      default:
        this.sessionStore.update(session.phone, { menu: 'main_menu' });
        return vxml(getDigits(`Main menu. ${MAIN_MENU_PROMPT}`));
    }
  }

  // ── Main menu ─────────────────────────────────────────────────────────────

  private async handleMainMenu(session: IvrSession, digit: string, sessionId: string): Promise<string> {
    const choiceMap: Record<string, string> = {
      '1': 'symptom_check', '2': 'appointment_info', '3': 'health_tips', '0': 'emergency',
    };
    this.callLog.log({
      sessionId, callerPhone: session.phone,
      patientId: session.patientId, patientName: session.patientName, patientType: session.patientType,
      action: IvrMenuAction.MAIN_MENU, menuKey: choiceMap[digit] ?? 'invalid', digitPressed: digit,
    });
    switch (digit) {
      case '1': return this.startSymptomCheck(session);
      case '2': return this.handleAppointmentInfo(session, sessionId);
      case '3': return this.handleHealthTips(session, sessionId);
      case '0': return this.handleEmergency(session, sessionId);
      default:  return vxml(getDigits(`Invalid option. ${MAIN_MENU_PROMPT}`));
    }
  }

  private handleReturnToMenu(session: IvrSession, digit: string): string {
    switch (digit) {
      case '1':
        this.sessionStore.update(session.phone, { menu: 'main_menu' });
        return vxml(getDigits(`Main menu. ${MAIN_MENU_PROMPT}`));
      case '0': return this.handleEmergency(session, session.sessionId);
      default:  return vxml(getDigits('Press 1 to return to the main menu. Press 0 for emergency.'));
    }
  }

  // ── Symptom check ─────────────────────────────────────────────────────────

  private startSymptomCheck(session: IvrSession): string {
    this.sessionStore.update(session.phone, { symptoms: {} });
    if (!session.patientType) {
      this.sessionStore.update(session.phone, { menu: 'patient_type_select' });
      return vxml(getDigits(
        'Are you calling about a pregnancy or a newborn baby? ' +
        'Press 1 for pregnancy. Press 2 for newborn baby.',
      ));
    }
    return this.askFirstSymptomQuestion(session.phone, session.patientType);
  }

  private handlePatientTypeSelect(session: IvrSession, digit: string): string {
    if (digit === '1') {
      this.sessionStore.update(session.phone, { patientType: 'prenatal' });
      return this.askFirstSymptomQuestion(session.phone, 'prenatal');
    }
    if (digit === '2') {
      this.sessionStore.update(session.phone, { patientType: 'neonatal' });
      return this.askFirstSymptomQuestion(session.phone, 'neonatal');
    }
    return vxml(getDigits('Invalid option. Press 1 for pregnancy. Press 2 for newborn baby.'));
  }

  private askFirstSymptomQuestion(phone: string, patientType: 'prenatal' | 'neonatal'): string {
    const firstQ = patientType === 'prenatal' ? PRENATAL_QUESTIONS[0] : NEONATAL_QUESTIONS[0];
    this.sessionStore.update(phone, { menu: firstQ.menu });
    return vxml(getDigits(firstQ.prompt));
  }

  private handleSymptomQuestion(session: IvrSession, digit: string, sessionId: string): string {
    const question = ALL_QUESTIONS.find((q) => q.menu === session.menu);
    if (!question) {
      this.sessionStore.update(session.phone, { menu: 'main_menu' });
      return vxml(getDigits(`Sorry, an error occurred. ${MAIN_MENU_PROMPT}`));
    }
    const score = question.scoreMap[digit];
    if (score === undefined) {
      this.callLog.log({
        sessionId, callerPhone: session.phone, patientId: session.patientId,
        patientType: session.patientType, action: IvrMenuAction.INVALID_INPUT,
        menuKey: session.menu, digitPressed: digit,
      });
      return vxml(getDigits(`Invalid option. ${question.prompt}`));
    }
    const answerLabel = this.extractAnswerLabel(question.prompt, digit);
    this.callLog.log({
      sessionId, callerPhone: session.phone,
      patientId: session.patientId, patientName: session.patientName, patientType: session.patientType,
      action: IvrMenuAction.SYMPTOM_ANSWER, menuKey: session.menu,
      questionText: question.prompt.split('Press')[0].trim(),
      digitPressed: digit, answerLabel, answerScore: score,
    });
    const symptoms = { ...session.symptoms, [question.field]: score };
    this.sessionStore.update(session.phone, { symptoms, menu: question.next });
    if (question.next === 'risk_result') {
      return this.computeAndReadResult(session.phone, symptoms, session.patientType!, sessionId);
    }
    const nextQ = ALL_QUESTIONS.find((q) => q.menu === question.next);
    if (!nextQ) return this.computeAndReadResult(session.phone, symptoms, session.patientType!, sessionId);
    return vxml(getDigits(nextQ.prompt));
  }

  // ── Risk result ───────────────────────────────────────────────────────────

  private computeAndReadResult(
    phone: string,
    symptoms: Record<string, number>,
    patientType: 'prenatal' | 'neonatal',
    sessionId: string,
  ): string {
    const result = this.riskEngine.assess({ ...symptoms, patientType } as RiskEngineInput);
    this.logger.log(`IVR risk result — phone=${phone} type=${patientType} score=${result.score} category=${result.riskCategory}`);
    const s = this.sessionStore.getOrCreate(phone);
    this.sessionStore.update(phone, { menu: 'risk_result' });

    // Log the risk result — this also updates riskScore/riskLevel columns in the DB
    this.callLog.log({
      sessionId, callerPhone: phone,
      patientId: s.patientId, patientName: s.patientName, patientType: s.patientType,
      action: IvrMenuAction.RISK_RESULT,
      riskScore: result.score, riskCategory: result.riskCategory, carePathway: result.carePathway,
    });

    // Persist to risk_assessments table — triggers alerts if high/critical
    this.riskAssessmentsService.create(
      {
        patientId:   s.patientId   ?? 'ivr-unregistered',
        patientName: s.patientName ?? `Unknown caller (${phone})`,
        patientPhone: phone,
        patientType: patientType === 'prenatal' ? PatientType.PRENATAL : PatientType.NEONATAL,
        score:   result.score,
        message: result.message,
        answers: symptoms as Record<string, unknown>,
      },
      { id: s.patientId ?? 'ivr-system', role: patientType } as any,
    ).catch((err: unknown) =>
      this.logger.error(`Failed to persist IVR risk assessment for ${phone}`, err instanceof Error ? err.message : String(err)),
    );

    const urgentSuffix = result.requiresImmediateAction ? 'Please seek medical help immediately. ' : '';
    return vxml(
      say(
        `Your health assessment is complete. ` +
        `Your risk level is: ${this.riskCategoryToSpeech(result.riskCategory)}. ` +
        `${result.message} ${result.recommendations[0] ?? ''} ${urgentSuffix}`,
      ),
      getDigits('Press 1 to repeat this result. Press 2 to return to the main menu. Press 0 for emergency contacts.'),
    );
  }

  private handlePostResult(session: IvrSession, digit: string): string {
    switch (digit) {
      case '1': return this.computeAndReadResult(session.phone, session.symptoms, session.patientType ?? 'prenatal', session.sessionId);
      case '2':
        this.sessionStore.update(session.phone, { menu: 'main_menu' });
        return vxml(getDigits(`Main menu. ${MAIN_MENU_PROMPT}`));
      case '0': return this.handleEmergency(session, session.sessionId);
      default:  return vxml(getDigits('Press 1 to repeat. Press 2 for main menu. Press 0 for emergency.'));
    }
  }

  // ── Appointment info ──────────────────────────────────────────────────────

  private async handleAppointmentInfo(session: IvrSession, sessionId: string): Promise<string> {
    this.sessionStore.update(session.phone, { menu: 'appointment_info' });
    this.callLog.log({
      sessionId, callerPhone: session.phone,
      patientId: session.patientId, patientType: session.patientType,
      action: IvrMenuAction.APPOINTMENT_INFO,
    });
    try {
      if (session.patientId) {
        const appts = session.patientType === 'prenatal'
          ? await this.appointmentsService.findByPatient(session.patientId, undefined)
          : await this.appointmentsService.findByPatient(undefined, session.patientId);
        const today = new Date().toISOString().split('T')[0];
        const upcoming = appts.filter((a) => a.date >= today);
        if (upcoming.length > 0) {
          const next = upcoming[0];
          const dateStr = new Date(next.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
          return vxml(
            say(`Your next appointment is on ${dateStr} at ${next.time ?? 'a time to be confirmed'} at your health centre. Please remember to bring your health card.`),
            getDigits('Press 1 to return to the main menu. Press 0 for emergency.'),
          );
        }
      }
      return vxml(
        say('You have no upcoming appointments scheduled at this time. Please contact your health centre to book one.'),
        getDigits('Press 1 to return to the main menu. Press 0 for emergency.'),
      );
    } catch (err) {
      this.logger.error('Error fetching appointments for IVR', err);
      return vxml(
        say('Sorry, we could not retrieve your appointment information at this time. Please try again later.'),
        getDigits('Press 1 to return to the main menu.'),
      );
    }
  }

  // ── Health tips ───────────────────────────────────────────────────────────

  private handleHealthTips(session: IvrSession, sessionId: string): string {
    this.sessionStore.update(session.phone, { menu: 'health_tips' });
    this.callLog.log({
      sessionId, callerPhone: session.phone,
      patientId: session.patientId, patientType: session.patientType,
      action: IvrMenuAction.HEALTH_TIPS,
    });
    const tips = session.patientType === 'neonatal'
      ? [
          'Breastfeed your baby exclusively for the first six months.',
          'Keep your baby warm and dry at all times.',
          'Attend all postnatal care visits at your health centre.',
          'Watch for danger signs such as difficulty breathing, not feeding, or high fever.',
        ]
      : [
          'Attend all antenatal care visits at your health centre.',
          'Eat a balanced diet with plenty of vegetables, fruits, and protein.',
          'Rest adequately and avoid heavy lifting.',
          'Take your iron and folic acid tablets every day.',
          'If you feel unwell, do not wait — visit your health centre.',
        ];
    return vxml(
      say(`Health tips for you. ${tips.join(' ')}`),
      getDigits('Press 1 to return to the main menu. Press 0 for emergency.'),
    );
  }

  // ── Emergency ─────────────────────────────────────────────────────────────

  private handleEmergency(session: IvrSession, sessionId: string): string {
    this.sessionStore.update(session.phone, { menu: 'emergency' });
    this.callLog.log({
      sessionId, callerPhone: session.phone,
      patientId: session.patientId, patientType: session.patientType,
      action: IvrMenuAction.EMERGENCY,
    });
    return vxml(
      say(
        'Emergency contacts. For an ambulance, call 9 9 8. ' +
        'For the health emergency hotline, call 1 1 6. ' +
        'For your nearest health centre, please contact your district health office. ' +
        'If you are in immediate danger, please hang up and call 9 9 8 now.',
      ),
      getDigits('Press 1 to return to the main menu.'),
    );
  }

  // ── Timeout re-prompt ─────────────────────────────────────────────────────

  private repromptCurrentMenu(session: IvrSession): string {
    const prefix = 'We did not receive your input. ';
    switch (session.menu) {
      case 'main_menu':          return vxml(getDigits(`${prefix}${MAIN_MENU_PROMPT}`));
      case 'patient_type_select': return vxml(getDigits(`${prefix}Press 1 for pregnancy. Press 2 for newborn baby.`));
      case 'appointment_info':
      case 'health_tips':
      case 'emergency':          return vxml(getDigits(`${prefix}Press 1 to return to the main menu. Press 0 for emergency.`));
      case 'risk_result':        return vxml(getDigits(`${prefix}Press 1 to repeat. Press 2 for main menu. Press 0 for emergency.`));
      default: {
        const q = ALL_QUESTIONS.find((q) => q.menu === session.menu);
        if (q) return vxml(getDigits(`${prefix}${q.prompt}`));
        this.sessionStore.update(session.phone, { menu: 'main_menu' });
        return vxml(getDigits(`Main menu. ${MAIN_MENU_PROMPT}`));
      }
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async resolvePatient(session: IvrSession): Promise<void> {
    try {
      const prenatal = await this.patientsService.findPrenatalByPhone(session.phone);
      if (prenatal) {
        this.sessionStore.update(session.phone, { patientType: 'prenatal', patientId: prenatal.id, patientName: prenatal.fullName });
        return;
      }
      const neonatal = await this.patientsService.findNeonatalByMotherPhone(session.phone);
      if (neonatal) {
        this.sessionStore.update(session.phone, { patientType: 'neonatal', patientId: neonatal.id, patientName: neonatal.motherName });
      }
    } catch (err) {
      this.logger.error(`Failed to resolve patient for phone ${session.phone}`, err instanceof Error ? err.message : String(err));
    }
  }

  private riskCategoryToSpeech(category: RiskCategory): string {
    switch (category) {
      case RiskCategory.LOW:      return 'Low Risk. You appear to be in good health.';
      case RiskCategory.MODERATE: return 'Moderate Risk. Some symptoms need attention.';
      case RiskCategory.HIGH:     return 'High Risk. Please visit your health centre today.';
      case RiskCategory.CRITICAL: return 'CRITICAL. You need immediate medical attention.';
    }
  }

  private deriveOutcome(session: IvrSession | undefined): IvrCallOutcome {
    if (!session) return IvrCallOutcome.ABANDONED_EARLY;
    if (session.menu === 'risk_result')      return IvrCallOutcome.RISK_COMPLETED;
    if (session.menu === 'emergency')        return IvrCallOutcome.EMERGENCY;
    if (session.menu === 'health_tips')      return IvrCallOutcome.TIPS;
    if (session.menu === 'appointment_info') return IvrCallOutcome.APPOINTMENT;
    return IvrCallOutcome.ABANDONED_EARLY;
  }

  private extractAnswerLabel(prompt: string, digit: string): string {
    const match = prompt.match(new RegExp(`Press ${digit} (?:for |if )([^.]+)`, 'i'));
    return match ? match[1].trim() : `Option ${digit}`;
  }

  private normalisePhone(phone: string): string {
    let p = phone.replace(/\s/g, '');
    if (p.startsWith('0'))                              p = '+265' + p.slice(1);
    else if (/^\d{9}$/.test(p))                        p = '+265' + p;
    else if (p.startsWith('265') && !p.startsWith('+')) p = '+' + p;
    return p;
  }

  // ── Outbound call ─────────────────────────────────────────────────────────
}