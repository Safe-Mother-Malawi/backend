import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus, AppointmentType } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { EventsGateway, SocketEvent } from '../events/events.gateway';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { RiskEngineService, RiskEngineInput, CarePathway, RiskEngineResult } from '../risk-engine/risk-engine.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
    @InjectRepository(NeonatalPatient)
    private readonly neonatalRepo: Repository<NeonatalPatient>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    private readonly eventsGateway: EventsGateway,
    private readonly riskEngineService: RiskEngineService,
  ) {}

  async create(dto: CreateAppointmentDto, createdBy: User): Promise<Appointment> {
    let appt = this.repo.create({ ...dto, createdById: createdBy.id });

    // 1. Process ANC Visit if ancData is provided
    if (appt.ancData) {
      await this._processAncVisit(appt, createdBy);
    }

    const saved = await this.repo.save(appt);

    // In-app notification to all clinicians and DHOs
    const [clinicians, dhos] = await Promise.all([
      this.usersService.findByRole(UserRole.CLINICIAN),
      this.usersService.findByRole(UserRole.DHO),
    ]);
    const recipientIds = [...clinicians, ...dhos]
      .map(u => u.id)
      .filter(id => id !== createdBy.id);

    if (recipientIds.length > 0) {
      await this.notificationsService.broadcast(
        recipientIds,
        'New Appointment Scheduled',
        `Appointment for ${dto.patientName ?? 'a patient'} on ${dto.date} at ${dto.time}.`,
        NotificationType.APPOINTMENT,
      );
    }

    // Notify the patient if they have a linked mobile account
    await this._notifyPatient(saved);

    this.eventsGateway.emit(SocketEvent.APPOINTMENT_CHANGED, { action: 'created' });
    return saved;
  }

  async findAll(): Promise<Appointment[]> {
    return this.repo.find({ relations: ['createdBy'], order: { date: 'ASC', time: 'ASC' } });
  }

  async findFiltered(filters: {
    clinicianId?: string;
    date?: string;       // YYYY-MM-DD — exact date
    upcoming?: boolean;  // only future appointments
  }): Promise<Appointment[]> {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.createdBy', 'createdBy')
      .leftJoinAndSelect('a.clinician', 'clinician')
      .orderBy('a.date', 'ASC')
      .addOrderBy('a.time', 'ASC');

    if (filters.clinicianId) {
      // Filter by either createdById or clinicianId
      qb.andWhere('(a.createdById = :cid OR a.clinicianId = :cid)', { cid: filters.clinicianId });
    }
    if (filters.date) {
      qb.andWhere('a.date = :date', { date: filters.date });
    }
    if (filters.upcoming) {
      qb.andWhere('a.date >= CURRENT_DATE');
    }
    return qb.getMany();
  }

  async findByPatient(prenatalId?: string, neonatalId?: string): Promise<Appointment[]> {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.date', 'ASC');
    if (prenatalId) qb.where('a.prenatalPatientId = :prenatalId', { prenatalId });
    else if (neonatalId) qb.where('a.neonatalPatientId = :neonatalId', { neonatalId });
    return qb.getMany();
  }

  async findMyAppointments(userId: string, role: string): Promise<Appointment[]> {
    if (role === UserRole.PRENATAL) {
      const p = await this.prenatalRepo.findOne({ where: { userId } });
      if (p) return this.findByPatient(p.id, undefined);
    } else if (role === UserRole.NEONATAL) {
      const p = await this.neonatalRepo.findOne({ where: { userId } });
      if (p) return this.findByPatient(undefined, p.id);
    }
    return [];
  }

  async findOne(id: string): Promise<Appointment> {
    const appt = await this.repo.findOne({ where: { id }, relations: ['createdBy'] });
    if (!appt) throw new NotFoundException('Appointment not found.');
    return appt;
  }

  async update(id: string, dto: Partial<CreateAppointmentDto>): Promise<Appointment> {
    const existing = await this.findOne(id);
    await this.repo.update(id, dto);
    const updated = await this.findOne(id);
    
    // Notify the patient about the updated appointment
    await this._notifyPatient(updated, 'updated');
    this.eventsGateway.emit(SocketEvent.APPOINTMENT_CHANGED, { action: 'updated' });
    return updated;
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    await this.repo.update(id, { status });
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const appt = await this.findOne(id);
    await this.repo.remove(appt);
  }

  /** Manually send a reminder notification for a specific appointment */
  async sendManualReminder(id: string): Promise<void> {
    const appt = await this.findOne(id);
    let patientUserId: string | null = null;

    if (appt.prenatalPatientId) {
      const p = await this.prenatalRepo.findOne({ where: { id: appt.prenatalPatientId } });
      patientUserId = p?.userId ?? null;
    } else if (appt.neonatalPatientId) {
      const p = await this.neonatalRepo.findOne({ where: { id: appt.neonatalPatientId } });
      patientUserId = p?.userId ?? null;
    }

    if (!patientUserId) {
      this.logger.warn(`No linked patient user for appointment ${id} — reminder not sent`);
      return;
    }

    const time = appt.time ? ` at ${appt.time}` : '';
    const location = appt.location ? ` at ${appt.location}` : '';

    await this.notificationsService.broadcast(
      [patientUserId],
      '📅 Appointment Reminder',
      `Reminder: "${appt.title}"${time}${location} on ${appt.date}. Please don't miss your appointment.`,
      NotificationType.APPOINTMENT,
    );
  }

  /**
   * Notify the patient about their appointment via in-app notification.
   * Finds the patient's linked User account and creates a notification.
   */
  private async _notifyPatient(appointment: Appointment, action: 'created' | 'updated' = 'created'): Promise<void> {
    try {
      let patientUserId: string | null = null;

      // Find the patient's linked user account
      if (appointment.prenatalPatientId) {
        const patient = await this.prenatalRepo.findOne({
          where: { id: appointment.prenatalPatientId },
        });
        patientUserId = patient?.userId ?? null;
      } else if (appointment.neonatalPatientId) {
        const patient = await this.neonatalRepo.findOne({
          where: { id: appointment.neonatalPatientId },
        });
        patientUserId = patient?.userId ?? null;
      }

      // If patient has a linked mobile account, send notification
      if (patientUserId) {
        const title = action === 'created' 
          ? 'New Appointment Scheduled' 
          : 'Appointment Updated';
        
        // Build detailed appointment info for notification
        const appointmentDetails = [
          `Title: ${appointment.title}`,
          `Date: ${appointment.date}`,
          appointment.time ? `Time: ${appointment.time}` : null,
          appointment.location ? `Location: ${appointment.location}` : null,
          appointment.doctor ? `Doctor: ${appointment.doctor}` : null,
          `Status: ${appointment.status}`,
        ].filter(Boolean).join('\n');
        
        const body = action === 'created'
          ? `Your appointment has been scheduled.\n\n${appointmentDetails}`
          : `Your appointment has been updated.\n\n${appointmentDetails}`;

        await this.notificationsService.broadcast(
          [patientUserId],
          title,
          body,
          NotificationType.APPOINTMENT,
        );

        this.logger.log(`Notification sent to patient user ${patientUserId} for appointment ${appointment.id}`);
      } else {
        this.logger.log(`No linked user account found for appointment ${appointment.id}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify patient for appointment ${appointment.id}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Automates the ANC Visit Flow:
   * 1. Maps ancData to RiskEngineInput
   * 2. Runs RiskEngineService.assess()
   * 3. Attaches riskResult to appointment
   * 4. Auto-schedules next appointment based on CarePathway
   * 5. Triggers alerts for High/Critical risk
   */
  private async _processAncVisit(appt: Appointment, createdBy: User): Promise<void> {
    try {
      const data = appt.ancData;
      if (!data) return;

      const bpParts = data.vitals?.bloodPressure?.split('/');
      const systolicBP = bpParts?.[0] ? parseInt(bpParts[0]) : undefined;
      const diastolicBP = bpParts?.[1] ? parseInt(bpParts[1]) : undefined;

      const dangerSigns = (data.dangerSigns || []) as string[];
      const fetalMovementStr = data.pregnancyMonitoring?.fetalMovement;

      let fmScore = 0;
      if (fetalMovementStr === 'Absent') fmScore = 7;
      else if (fetalMovementStr === 'Reduced') fmScore = 3;

      const input: RiskEngineInput = {
        patientType: 'prenatal',
        systolicBP,
        diastolicBP,
        hasHeavyBleeding: dangerSigns.includes('Bleeding'),
        hasSevereHeadacheWithVision: dangerSigns.includes('Severe headache'),
        hasSuddenSevereSwelling: dangerSigns.includes('Swollen feet'),
        fetalMovement: fmScore,
        hasNoFetalMovement: fetalMovementStr === 'Absent' || dangerSigns.includes('Reduced fetal movement'),
      };

      const riskResult = this.riskEngineService.assess(input);
      appt.riskResult = riskResult;

      // Alerts Generated
      if (riskResult.requiresImmediateAction) {
        const [clinicians, dhos] = await Promise.all([
          this.usersService.findByRole(UserRole.CLINICIAN),
          this.usersService.findByRole(UserRole.DHO),
        ]);
        const recipientIds = [...clinicians, ...dhos]
          .map(u => u.id)
          .filter(id => id !== createdBy.id);

        if (recipientIds.length > 0) {
          await this.notificationsService.broadcast(
            recipientIds,
            'EMERGENCY: High Risk Patient',
            `Patient ${appt.patientName} requires immediate action. Risk: ${riskResult.riskCategory}. Flags: ${riskResult.clinicalFlags.join(', ')}`,
            NotificationType.ALERT,
          );
        }
      }

      // Next Visit Scheduled
      let daysToAdd = 0;
      let schedulingNote = `Auto-scheduled based on Care Pathway: ${riskResult.carePathway}`;

      if (riskResult.carePathway === CarePathway.ROUTINE_ANC) {
        const weeks = parseFloat(data.pregnancyMonitoring?.gestationalAge);
        if (!isNaN(weeks)) {
          if (weeks < 20) { daysToAdd = (20 - weeks) * 7; }
          else if (weeks < 26) { daysToAdd = (26 - weeks) * 7; }
          else if (weeks < 30) { daysToAdd = (30 - weeks) * 7; }
          else if (weeks < 34) { daysToAdd = (34 - weeks) * 7; }
          else if (weeks < 36) { daysToAdd = (36 - weeks) * 7; }
          else if (weeks < 38) { daysToAdd = (38 - weeks) * 7; }
          else if (weeks < 40) { daysToAdd = (40 - weeks) * 7; }
          else { daysToAdd = 7; } // after 40 weeks, weekly
          schedulingNote = `Auto-scheduled based on Gestational Age (${weeks} weeks) -> Next at ${weeks + (daysToAdd / 7)} weeks`;
        } else {
          daysToAdd = 28; // fallback to 4 weeks if gestational age is missing
        }
      } else if (riskResult.carePathway === CarePathway.ENHANCED_ANC) {
        daysToAdd = 7; // 1 week
      }

      if (daysToAdd > 0) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        
        // Auto-schedule the next appointment
        const nextAppt = this.repo.create({
          title: 'Scheduled ANC Follow-up',
          patientName: appt.patientName,
          patientContact: appt.patientContact,
          type: appt.type,
          status: AppointmentStatus.SCHEDULED,
          date: nextDate.toISOString().split('T')[0],
          prenatalPatientId: appt.prenatalPatientId,
          neonatalPatientId: appt.neonatalPatientId,
          createdById: createdBy.id,
          clinicianId: createdBy.id,
          notes: schedulingNote,
        });
        await this.repo.save(nextAppt);
        this.logger.log(`Auto-scheduled next visit for ${appt.patientName} on ${nextAppt.date}`);
      }

    } catch (e) {
      this.logger.error('Failed to process ANC visit risk engine/auto-schedule', e);
    }
  }

  /**
   * Automates the first ANC Visit scheduling based on LMP date.
   * This should be called immediately after a prenatal patient is registered.
   */
  async scheduleInitialAnc(prenatalId: string, lmpDateStr: string, patientName: string, district?: string): Promise<void> {
    try {
      const lmpDate = new Date(lmpDateStr);
      if (isNaN(lmpDate.getTime())) return;

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lmpDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const currentWeeks = diffDays / 7;

      let daysToAdd = 0;
      let targetWeeks = 0;

      if (currentWeeks < 20) { targetWeeks = 20; daysToAdd = (20 - currentWeeks) * 7; }
      else if (currentWeeks < 26) { targetWeeks = 26; daysToAdd = (26 - currentWeeks) * 7; }
      else if (currentWeeks < 30) { targetWeeks = 30; daysToAdd = (30 - currentWeeks) * 7; }
      else if (currentWeeks < 34) { targetWeeks = 34; daysToAdd = (34 - currentWeeks) * 7; }
      else if (currentWeeks < 36) { targetWeeks = 36; daysToAdd = (36 - currentWeeks) * 7; }
      else if (currentWeeks < 38) { targetWeeks = 38; daysToAdd = (38 - currentWeeks) * 7; }
      else if (currentWeeks < 40) { targetWeeks = 40; daysToAdd = (40 - currentWeeks) * 7; }
      else { targetWeeks = currentWeeks + 1; daysToAdd = 7; } // after 40 weeks, schedule next week

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      const appt = this.repo.create({
        title: 'Initial ANC Visit',
        patientName: patientName,
        patientContact: 'N/A',
        type: AppointmentType.ANC,
        status: AppointmentStatus.SCHEDULED,
        date: nextDate.toISOString().split('T')[0],
        time: '09:00 AM', // Default morning time
        location: district ? `${district} Health Center` : 'Local Health Center',
        prenatalPatientId: prenatalId,
        notes: `Auto-scheduled Initial ANC at ${targetWeeks} weeks based on LMP (${lmpDateStr}).`,
      });

      await this.repo.save(appt);
      this.logger.log(`Auto-scheduled initial ANC visit for ${patientName} on ${appt.date} (${targetWeeks} weeks)`);
    } catch (error) {
      this.logger.error(`Failed to auto-schedule initial ANC for ${prenatalId}`, error);
    }
  }
}
