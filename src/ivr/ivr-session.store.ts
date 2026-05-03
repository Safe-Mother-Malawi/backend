/**
 * IVR Session Store — in-memory, keyed by caller phone number.
 *
 * Each call gets a session that tracks:
 *  - which menu the caller is currently in
 *  - partial symptom answers collected so far
 *  - patient type (prenatal | neonatal) resolved from DB
 *  - language preference
 *
 * Sessions expire after IVR_SESSION_TTL_MS of inactivity.
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';

export type IvrMenu =
  | 'welcome'
  | 'main_menu'
  | 'patient_type_select'
  | 'symptom_prenatal_wellbeing'
  | 'symptom_prenatal_headache'
  | 'symptom_prenatal_swelling'
  | 'symptom_prenatal_fetal'
  | 'symptom_prenatal_bleeding'
  | 'symptom_neonatal_breathing'
  | 'symptom_neonatal_feeding'
  | 'symptom_neonatal_skin'
  | 'symptom_neonatal_temp'
  | 'symptom_neonatal_activity'
  | 'risk_result'
  | 'appointment_info'
  | 'health_tips'
  | 'emergency';

export interface IvrSession {
  phone: string;
  sessionId: string;           // Africa's Talking session ID — stored for log correlation
  patientType: 'prenatal' | 'neonatal' | null;
  patientId: string | null;
  patientName: string | null;
  menu: IvrMenu;
  symptoms: Record<string, number>;
  lastActivity: number;
}

const IVR_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class IvrSessionStore implements OnModuleDestroy {
  private readonly sessions = new Map<string, IvrSession>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    // Periodically evict expired sessions to prevent unbounded memory growth
    this.cleanupTimer = setInterval(() => this.evictExpired(), CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupTimer);
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [phone, session] of this.sessions.entries()) {
      if (now - session.lastActivity > IVR_SESSION_TTL_MS) {
        this.sessions.delete(phone);
      }
    }
  }

  get(phone: string): IvrSession | undefined {
    const s = this.sessions.get(phone);
    if (!s) return undefined;
    // Expire stale sessions
    if (Date.now() - s.lastActivity > IVR_SESSION_TTL_MS) {
      this.sessions.delete(phone);
      return undefined;
    }
    return s;
  }

  create(phone: string): IvrSession {
    const session: IvrSession = {
      phone,
      sessionId: '',
      patientType: null,
      patientId: null,
      patientName: null,
      menu: 'welcome',
      symptoms: {},
      lastActivity: Date.now(),
    };
    this.sessions.set(phone, session);
    return session;
  }

  getOrCreate(phone: string): IvrSession {
    return this.get(phone) ?? this.create(phone);
  }

  update(phone: string, patch: Partial<IvrSession>): IvrSession {
    const s = this.getOrCreate(phone);
    Object.assign(s, patch, { lastActivity: Date.now() });
    this.sessions.set(phone, s);
    return s;
  }

  destroy(phone: string): void {
    this.sessions.delete(phone);
  }
}
