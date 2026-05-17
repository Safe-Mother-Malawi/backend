import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';

import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';

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
  ) {}

  async create(dto: CreateAppointmentDto, createdBy: User): Promise<Appointment> {
    const appt = this.repo.create({ ...dto, createdById: createdBy.id });
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

    // SMS reminder to the patient if a contact number is provided
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
}
