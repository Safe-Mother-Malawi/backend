import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusyResponse, BusyReason } from '../entities/busy-response.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { MarkBusyDto } from '../dto/mark-busy.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { RemindersService } from '../../reminders/reminders.service';
import { PrenatalPatient } from '../../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../../patients/entities/neonatal-patient.entity';
import { EventsGateway, SocketEvent } from '../../events/events.gateway';

@Injectable()
export class BusyResponseService {
  private readonly logger = new Logger(BusyResponseService.name);

  constructor(
    @InjectRepository(BusyResponse)
    private readonly busyResponseRepo: Repository<BusyResponse>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
    @InjectRepository(NeonatalPatient)
    private readonly neonatalRepo: Repository<NeonatalPatient>,
    private readonly notificationsService: NotificationsService,
    private readonly remindersService: RemindersService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Mark an appointment as busy (patient unavailable)
   */
  async markAsBusy(
    appointmentId: string,
    userId: string,
    dto: MarkBusyDto,
  ): Promise<BusyResponse> {
    // Find appointment
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['createdBy', 'clinician'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Create busy response record
    const busyResponse = this.busyResponseRepo.create({
      appointmentId,
      userId,
      reason: dto.reason,
      additionalNotes: dto.additionalNotes,
      respondedAt: new Date(),
      rescheduleRequested: dto.rescheduleRequested ?? false,
      preferredRescheduleDate: dto.preferredRescheduleDate ? new Date(dto.preferredRescheduleDate) : null,
      preferredRescheduleTime: dto.preferredRescheduleTime,
    });

    const saved = await this.busyResponseRepo.save(busyResponse);

    // Update appointment status
    appointment.status = AppointmentStatus.PATIENT_UNAVAILABLE;
    await this.appointmentRepo.save(appointment);

    // Cancel pending reminders
    await this.remindersService.cancelPendingAppointmentReminders(appointmentId);

    // Notify clinician
    await this._notifyClinicianOfBusyResponse(appointment, busyResponse);

    // Emit WebSocket event
    this.eventsGateway.emit(SocketEvent.APPOINTMENT_CHANGED, {
      action: 'patient_busy',
      appointmentId,
      reason: dto.reason,
    });

    this.logger.log(`Patient marked appointment ${appointmentId} as busy. Reason: ${dto.reason}`);

    return saved;
  }

  /**
   * Get busy responses for an appointment
   */
  async findByAppointment(appointmentId: string): Promise<BusyResponse[]> {
    return this.busyResponseRepo.find({
      where: { appointmentId },
      order: { respondedAt: 'DESC' },
    });
  }

  /**
   * Get busy responses for a user
   */
  async findByUser(userId: string): Promise<BusyResponse[]> {
    return this.busyResponseRepo.find({
      where: { userId },
      relations: ['appointment'],
      order: { respondedAt: 'DESC' },
    });
  }

  /**
   * Get busy response by ID
   */
  async findById(id: string): Promise<BusyResponse | null> {
    return this.busyResponseRepo.findOne({
      where: { id },
      relations: ['appointment'],
    });
  }

  /**
   * Approve reschedule request
   */
  async approveReschedule(busyResponseId: string, newDate: string, newTime?: string): Promise<Appointment> {
    const busyResponse = await this.findById(busyResponseId);
    if (!busyResponse) {
      throw new NotFoundException('Busy response not found');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: { id: busyResponse.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Update appointment with new date/time
    appointment.date = newDate;
    if (newTime) {
      appointment.time = newTime;
    }
    appointment.status = AppointmentStatus.RESCHEDULE_REQUESTED;

    const updated = await this.appointmentRepo.save(appointment);

    // Recreate reminders for new date/time
    await this.remindersService.replaceAppointmentReminders({
      appointmentId: appointment.id,
      userIds: await this._getReminderRecipientIds(appointment),
      appointmentDate: newDate,
      appointmentTime: newTime,
      title: appointment.title,
      patientName: appointment.patientName,
      location: appointment.location,
    });

    // Notify patient of rescheduled appointment
    const patientUserId = await this._getPatientUserId(appointment);
    if (patientUserId) {
      await this.notificationsService.create({
        userId: patientUserId,
        title: '✅ Appointment Rescheduled',
        body: `Your appointment has been rescheduled to ${newDate}${newTime ? ` at ${newTime}` : ''}. You will receive reminders before your appointment.`,
        type: NotificationType.APPOINTMENT,
      });
    }

    this.logger.log(`Appointment ${appointment.id} rescheduled to ${newDate} ${newTime || ''}`);

    return updated;
  }

  /**
   * Reject reschedule request
   */
  async rejectReschedule(busyResponseId: string, reason: string): Promise<void> {
    const busyResponse = await this.findById(busyResponseId);
    if (!busyResponse) {
      throw new NotFoundException('Busy response not found');
    }

    const appointment = await this.appointmentRepo.findOne({
      where: { id: busyResponse.appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Notify patient that reschedule was rejected
    const patientUserId = await this._getPatientUserId(appointment);
    if (patientUserId) {
      await this.notificationsService.create({
        userId: patientUserId,
        title: '⚠️ Reschedule Request Not Approved',
        body: `Your reschedule request for ${appointment.date} was not approved. Reason: ${reason}. Please contact your clinician.`,
        type: NotificationType.ALERT,
      });
    }

    this.logger.log(`Reschedule request for appointment ${appointment.id} was rejected`);
  }

  /**
   * Get statistics on busy responses
   */
  async getStatistics(appointmentId?: string): Promise<{
    totalBusyResponses: number;
    byReason: Record<string, number>;
    rescheduleRequested: number;
  }> {
    let query = this.busyResponseRepo.createQueryBuilder('br');

    if (appointmentId) {
      query = query.where('br.appointmentId = :appointmentId', { appointmentId });
    }

    const total = await query.getCount();

    const byReason = await this.busyResponseRepo
      .createQueryBuilder('br')
      .select('br.reason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('br.reason')
      .getRawMany();

    const reasonMap: Record<string, number> = {};
    byReason.forEach((r) => {
      reasonMap[r.reason] = parseInt(r.count, 10);
    });

    const rescheduleCount = await this.busyResponseRepo.count({
      where: { rescheduleRequested: true },
    });

    return {
      totalBusyResponses: total,
      byReason: reasonMap,
      rescheduleRequested: rescheduleCount,
    };
  }

  /**
   * Notify clinician of busy response
   */
  private async _notifyClinicianOfBusyResponse(
    appointment: Appointment,
    busyResponse: BusyResponse,
  ): Promise<void> {
    const clinicianId = appointment.clinicianId || appointment.createdById;
    if (!clinicianId) return;

    const reasonLabel = this._getBusyReasonLabel(busyResponse.reason);
    const rescheduleInfo = busyResponse.rescheduleRequested
      ? `\n\nPatient requested reschedule to: ${busyResponse.preferredRescheduleDate?.toDateString() || 'TBD'}${busyResponse.preferredRescheduleTime ? ` at ${busyResponse.preferredRescheduleTime}` : ''}`
      : '';

    const body = `Patient ${appointment.patientName} marked their appointment on ${appointment.date} as unavailable.\n\nReason: ${reasonLabel}${busyResponse.additionalNotes ? `\nNotes: ${busyResponse.additionalNotes}` : ''}${rescheduleInfo}`;

    await this.notificationsService.create({
      userId: clinicianId,
      title: '📅 Patient Unavailable for Appointment',
      body,
      type: NotificationType.APPOINTMENT,
    });

    this.logger.log(`Clinician ${clinicianId} notified of busy response for appointment ${appointment.id}`);
  }

  /**
   * Get patient user ID
   */
  private async _getPatientUserId(appointment: Appointment): Promise<string | null> {
    if (appointment.prenatalPatientId) {
      const patient = await this.prenatalRepo.findOne({
        where: { id: appointment.prenatalPatientId },
      });
      return patient?.userId ?? null;
    }

    if (appointment.neonatalPatientId) {
      const patient = await this.neonatalRepo.findOne({
        where: { id: appointment.neonatalPatientId },
      });
      return patient?.userId ?? null;
    }

    return null;
  }

  /**
   * Get reminder recipient IDs
   */
  private async _getReminderRecipientIds(appointment: Appointment): Promise<string[]> {
    const ids = new Set<string>();
    if (appointment.createdById) ids.add(appointment.createdById);
    if (appointment.clinicianId) ids.add(appointment.clinicianId);

    const patientUserId = await this._getPatientUserId(appointment);
    if (patientUserId) ids.add(patientUserId);

    return [...ids];
  }

  /**
   * Get human-readable label for busy reason
   */
  private _getBusyReasonLabel(reason: BusyReason): string {
    const labels: Record<BusyReason, string> = {
      [BusyReason.WORK_CONFLICT]: 'Work conflict',
      [BusyReason.HEALTH_ISSUE]: 'Health issue',
      [BusyReason.TRANSPORTATION]: 'Transportation issue',
      [BusyReason.FAMILY_EMERGENCY]: 'Family emergency',
      [BusyReason.FORGOT]: 'Forgot about appointment',
      [BusyReason.OTHER]: 'Other reason',
    };
    return labels[reason] || 'Unknown reason';
  }
}
