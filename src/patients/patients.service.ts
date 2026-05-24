import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrenatalPatient } from './entities/prenatal-patient.entity';
import { NeonatalPatient } from './entities/neonatal-patient.entity';
import { CreatePrenatalDto } from './dto/create-prenatal.dto';
import { CreateNeonatalDto } from './dto/create-neonatal.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { TrackingService } from '../tracking/tracking.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PrenatalPatient)
    private readonly prenatalRepo: Repository<PrenatalPatient>,
    @InjectRepository(NeonatalPatient)
    private readonly neonatalRepo: Repository<NeonatalPatient>,
    private readonly trackingService: TrackingService,
    private readonly activityLog: ActivityLogService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AppointmentsService))
    private readonly appointmentsService: AppointmentsService,
  ) {}

  // ── Phone-based linking ───────────────────────────────────────────────────
  /**
   * When a mobile user registers, link their User account to any existing
   * clinician-registered patient record that shares the same phone number.
   * If no existing record is found, create a new patient record automatically
   * so the patient appears in the clinician dashboard and patient lists.
   * Called from AuthService after registration.
   */
  async linkOrCreatePatientRecord(user: User): Promise<void> {
    const phone = user.phone;

    if (user.role === UserRole.PRENATAL) {
      const existing = await this.prenatalRepo.findOne({ where: { phone } });
      if (existing) {
        // Link to existing clinician-registered record
        if (!existing.userId) {
          await this.prenatalRepo.update(existing.id, { userId: user.id });
          await this.activityLog.log({
            action: ActivityAction.PATIENT_LINKED,
            actorId: user.id,
            description: `Prenatal patient ${existing.fullName} linked to mobile account`,
            resourceType: 'prenatal_patient',
            resourceId: existing.id,
          });
        }
      } else {
        // Self-registered — create a new patient record
        const patient = this.prenatalRepo.create({
          fullName:            user.fullName,
          phone:               user.phone,
          email:               user.email,
          age:                 user.age,
          nationality:         user.nationality,
          district:            user.district,
          facilityName:        user.facilityName,
          pregnancyMonths:     user.pregnancyMonths,
          pregnancyWeeks:      user.pregnancyWeeks,
          expectedDeliveryDate: user.expectedDeliveryDate,
          lmpDate:             user.lmpDate,
          village:             user.village,
          gravida:             user.gravida,
          parity:              user.parity,
          existingConditions:  user.existingConditions,
          emergencyContact:    user.emergencyContact,
          userId:              user.id,
          registeredById:      null, // self-registered
        });
        const saved = await this.prenatalRepo.save(patient);
        await this.activityLog.log({
          action: ActivityAction.PATIENT_CREATED,
          actorId: user.id,
          description: `Prenatal patient ${user.fullName} self-registered via mobile`,
          resourceType: 'prenatal_patient',
          resourceId: saved.id,
          meta: { district: user.district, facilityName: user.facilityName },
        });

        // Schedule initial ANC visit
        if (user.lmpDate) {
          await this.appointmentsService.scheduleInitialAnc(
            saved.id,
            user.lmpDate,
            saved.fullName,
            saved.district || undefined
          );
        }
      }
    }

    if (user.role === UserRole.NEONATAL) {
      const existing = await this.neonatalRepo.findOne({ where: { motherPhone: phone } });
      if (existing) {
        // Link to existing clinician-registered record
        if (!existing.userId) {
          await this.neonatalRepo.update(existing.id, { userId: user.id });
          await this.activityLog.log({
            action: ActivityAction.PATIENT_LINKED,
            actorId: user.id,
            description: `Neonatal patient ${existing.babyName} linked to mobile account`,
            resourceType: 'neonatal_patient',
            resourceId: existing.id,
          });
        }
      } else {
        // Self-registered — create a new patient record
        const patient = this.neonatalRepo.create({
          motherName:      user.fullName,
          motherPhone:     user.phone,
          motherEmail:     user.email,
          district:        user.district,
          facilityName:    user.facilityName,
          babyName:        user.babyName ?? 'Unknown',
          dateOfBirth:     user.babyDob ? new Date(user.babyDob) : new Date(),
          babyGender:      user.babyGender,
          birthWeight:     user.babyBirthWeight ? parseFloat(user.babyBirthWeight) : undefined,
          userId:          user.id,
        });

        // Auto-link to existing prenatal patient if not provided
        const prenatalRecord = await this.prenatalRepo.findOne({ where: { phone: user.phone } });
        if (prenatalRecord) {
          patient.prenatalPatientId = prenatalRecord.id;
        }
        const saved = (await this.neonatalRepo.save(patient)) as NeonatalPatient;

        // Seed vaccine schedule if DOB is available
        if (user.babyDob) {
          try {
            await this.trackingService.seedVaccines(saved.id, new Date(user.babyDob));
            await this.appointmentsService.scheduleInitialNeonatalVisit(saved.id, user.babyDob, saved.babyName, saved.district || undefined);
          } catch (_) { /* non-critical */ }
        }

        await this.activityLog.log({
          action: ActivityAction.PATIENT_CREATED,
          actorId: user.id,
          description: `Neonatal patient ${saved.babyName} (mother: ${user.fullName}) self-registered via mobile`,
          resourceType: 'neonatal_patient',
          resourceId: saved.id,
          meta: { district: user.district, facilityName: user.facilityName },
        });
      }
    }
  }

  /**
   * @deprecated Use linkOrCreatePatientRecord instead.
   * Kept for backward compatibility.
   */
  async linkUserByPhone(user: User): Promise<void> {
    return this.linkOrCreatePatientRecord(user);
  }

  /**
   * Get the patient record linked to a mobile user account.
   */
  async getMyPrenatalRecord(userId: string): Promise<PrenatalPatient | null> {
    return this.prenatalRepo.findOne({
      where: { userId },
      relations: ['registeredBy'],
    });
  }

  async getMyNeonatalRecord(userId: string): Promise<NeonatalPatient | null> {
    return this.neonatalRepo.findOne({
      where: { userId },
      relations: ['registeredBy'],
    });
  }

  // ── Prenatal ──────────────────────────────────────────────────────────────

  async createPrenatal(dto: CreatePrenatalDto, registeredBy: User): Promise<PrenatalPatient> {
    const patient = this.prenatalRepo.create({
      ...dto,
      email: dto.email || null,
      registeredById: registeredBy.id,
    });
    const saved = await this.prenatalRepo.save(patient);

    // If a password was provided, create a linked mobile User account
    if (dto.password) {
      await this._createOrUpdateMobileUser({
        phone:            dto.phone,
        email:            dto.email,
        password:         dto.password,
        role:             UserRole.PRENATAL,
        fullName:         dto.fullName,
        age:              dto.age,
        nationality:      dto.nationality,
        district:         dto.district,
        facilityName:     dto.facilityName,
        pregnancyMonths:  dto.pregnancyMonths,
        pregnancyWeeks:   dto.pregnancyWeeks,
        expectedDeliveryDate: dto.expectedDeliveryDate,
        lmpDate:          dto.lmpDate,
        village:          dto.village,
        gravida:          dto.gravida,
        parity:           dto.parity,
        existingConditions: dto.existingConditions,
        emergencyContact: dto.emergencyContact,
        patientId:        saved.id,
        patientRepo:      this.prenatalRepo as Repository<PrenatalPatient | NeonatalPatient>,
        userIdField:      'userId',
      });
    }

    await this.activityLog.log({
      action: ActivityAction.PATIENT_CREATED,
      actorId: registeredBy.id,
      description: `Prenatal patient ${saved.fullName} registered`,
      resourceType: 'prenatal_patient',
      resourceId: saved.id,
      meta: { district: saved.district, facilityName: saved.facilityName },
    });

    await this._notifyDhosAndAdmins(
      'New Prenatal Patient Registered',
      `${saved.fullName} has been registered as a prenatal patient in ${saved.district ?? 'unknown district'}.`,
      registeredBy.id,
    );

    // Schedule initial ANC visit
    if (dto.lmpDate) {
      await this.appointmentsService.scheduleInitialAnc(
        saved.id,
        dto.lmpDate,
        saved.fullName,
        saved.district || undefined
      );
    }

    return saved;
  }

  async findAllPrenatal(user: User, search?: string): Promise<PrenatalPatient[]> {
    const qb = this.prenatalRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.registeredBy', 'registeredBy')
      .orderBy('p.createdAt', 'DESC');

    // Clinicians see patients they registered AND self-registered patients
    // in their district (registeredById = null means self-registered)
    if (user.role === UserRole.CLINICIAN) {
      qb.where(
        '(p.registeredById = :id OR p.registeredById IS NULL)',
        { id: user.id },
      );
      // Scope self-registered patients to the clinician's district
      if (user.district) {
        qb.andWhere(
          '(p.registeredById = :id OR LOWER(p.district) = LOWER(:district))',
          { id: user.id, district: user.district },
        );
      }
    }

    if (search) {
      qb.andWhere(
        '(LOWER(p.fullName) LIKE :s OR p.phone LIKE :s OR LOWER(p.district) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }
    return qb.getMany();
  }

  async findOnePrenatal(id: string, viewedBy?: string): Promise<PrenatalPatient> {
    const patient = await this.prenatalRepo.findOne({
      where: { id },
      relations: ['registeredBy'],
    });
    if (!patient) throw new NotFoundException('Prenatal patient not found.');
    
    // Log patient view if viewedBy is provided
    if (viewedBy) {
      await this.activityLog.log({
        action: ActivityAction.PATIENT_VIEWED,
        actorId: viewedBy,
        description: `Prenatal patient ${patient.fullName} viewed`,
        resourceType: 'prenatal_patient',
        resourceId: id,
      });
    }
    
    return patient;
  }

  async findPrenatalByPhone(phone: string): Promise<PrenatalPatient | null> {
    return this.prenatalRepo.findOne({ where: { phone } });
  }

  async updatePrenatal(id: string, dto: Partial<CreatePrenatalDto>, actorId?: string): Promise<PrenatalPatient> {
    await this.prenatalRepo.update(id, dto);
    const updated = await this.findOnePrenatal(id);
    await this.activityLog.log({
      action: ActivityAction.PATIENT_UPDATED,
      actorId,
      description: `Prenatal patient ${updated.fullName} updated`,
      resourceType: 'prenatal_patient',
      resourceId: id,
    });
    return updated;
  }

  async deletePrenatal(id: string, actorId?: string): Promise<void> {
    const patient = await this.findOnePrenatal(id);
    await this.prenatalRepo.remove(patient);
    await this.activityLog.log({
      action: ActivityAction.PATIENT_DELETED,
      actorId,
      description: `Prenatal patient ${patient.fullName} deleted`,
      resourceType: 'prenatal_patient',
      resourceId: id,
    });
  }

  // ── Neonatal ──────────────────────────────────────────────────────────────

  async createNeonatal(dto: CreateNeonatalDto, registeredBy: User): Promise<NeonatalPatient> {
    const patient = this.neonatalRepo.create({
      motherName: dto.motherName,
      motherPhone: dto.motherPhone,
      motherEmail: dto.motherEmail || undefined,
      district: dto.district,
      facilityName: dto.facilityName,
      babyName: dto.babyName,
      dateOfBirth: new Date(dto.babyDob),
      babyGender: dto.babyGender,
      birthWeight: dto.babyBirthWeight ? parseFloat(dto.babyBirthWeight) : undefined,
    });

    // 1. DELIVERY FLOW: Transition Prenatal Mother to Neonatal
    let linkedUserId: string | null = null;
    const existingUser = await this.usersService.findByEmailOrPhone(dto.motherPhone);
    if (existingUser) {
      if (existingUser.role === UserRole.PRENATAL) {
        await this.usersService.updateUser(existingUser.id, { role: UserRole.NEONATAL });
      }
      linkedUserId = existingUser.id;
      patient.userId = linkedUserId; // Link baby to mother's account
    }

    // Auto-link to existing prenatal patient if not provided in dto
    if (!patient.prenatalPatientId) {
      const prenatalRecord = await this.prenatalRepo.findOne({ where: { phone: dto.motherPhone } });
      if (prenatalRecord) {
        patient.prenatalPatientId = prenatalRecord.id;
      }
    }

    const saved = (await this.neonatalRepo.save(patient)) as NeonatalPatient;

    // 2. Auto-seed the Malawi EPI vaccine schedule (Neonatal schedule created)
    const babyDob = new Date(dto.babyDob);
    await this.trackingService.seedVaccines(saved.id, babyDob);

    // 3. Handle mobile account creation/password update
    if (dto.password) {
      await this._createOrUpdateMobileUser({
        phone:        dto.motherPhone,
        email:        dto.motherEmail,
        password:     dto.password,
        role:         UserRole.NEONATAL,
        fullName:     dto.motherName,
        district:     dto.district,
        facilityName: dto.facilityName,
        babyName:     dto.babyName,
        babyDob:      dto.babyDob,
        babyGender:   dto.babyGender,
        babyBirthWeight: dto.babyBirthWeight,
        patientId:    saved.id,
        patientRepo:  this.neonatalRepo as Repository<PrenatalPatient | NeonatalPatient>,
        userIdField:  'userId',
      });
      if (!linkedUserId) {
        const newUser = await this.usersService.findByEmailOrPhone(dto.motherPhone);
        linkedUserId = newUser?.id || null;
      }
    }

    // 4. Notifications activated
    if (linkedUserId) {
      await this.notificationsService.broadcast(
        [linkedUserId],
        'Congratulations on your delivery! 👶',
        `Your baby ${saved.babyName}'s neonatal record and vaccination schedule have been created. You can now track upcoming immunizations in the app.`,
        NotificationType.INFO,
      );
    }

    await this.activityLog.log({
      action: ActivityAction.PATIENT_CREATED,
      actorId: registeredBy.id,
      description: `Neonatal patient ${saved.babyName} (mother: ${saved.motherName}) registered`,
      resourceType: 'neonatal_patient',
      resourceId: saved.id,
      meta: { district: saved.district, facilityName: saved.facilityName },
    });

    await this._notifyDhosAndAdmins(
      'New Neonatal Patient Registered',
      `${saved.babyName} (mother: ${saved.motherName}) has been registered in ${saved.district ?? 'unknown district'}.`,
      registeredBy.id,
    );

    return saved;
  }

  async findAllNeonatal(user: User, search?: string): Promise<NeonatalPatient[]> {
    const qb = this.neonatalRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.registeredBy', 'registeredBy')
      .orderBy('p.createdAt', 'DESC');

    // Clinicians see patients they registered AND self-registered patients
    // in their district (registeredById = null means self-registered)
    if (user.role === UserRole.CLINICIAN) {
      qb.where(
        '(p.registeredById = :id OR p.registeredById IS NULL)',
        { id: user.id },
      );
      if (user.district) {
        qb.andWhere(
          '(p.registeredById = :id OR LOWER(p.district) = LOWER(:district))',
          { id: user.id, district: user.district },
        );
      }
    }

    if (search) {
      qb.andWhere(
        '(LOWER(p.motherName) LIKE :s OR p.motherPhone LIKE :s OR LOWER(p.babyName) LIKE :s OR LOWER(p.district) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }
    return qb.getMany();
  }

  async findOneNeonatal(id: string, viewedBy?: string): Promise<NeonatalPatient> {
    const patient = await this.neonatalRepo.findOne({
      where: { id },
      relations: ['registeredBy'],
    });
    if (!patient) throw new NotFoundException('Neonatal patient not found.');
    
    // Log patient view if viewedBy is provided
    if (viewedBy) {
      await this.activityLog.log({
        action: ActivityAction.PATIENT_VIEWED,
        actorId: viewedBy,
        description: `Neonatal patient ${patient.babyName} viewed`,
        resourceType: 'neonatal_patient',
        resourceId: id,
      });
    }
    
    return patient;
  }

  async findNeonatalByMotherPhone(phone: string): Promise<NeonatalPatient | null> {
    return this.neonatalRepo.findOne({ where: { motherPhone: phone } });
  }

  /**
   * Patient history — risk assessments timeline for the clinician detail panel.
   * Imported lazily to avoid circular deps; RiskAssessment repo injected separately.
   */
  async getPatientHistory(patientId: string): Promise<{
    riskHistory: { submittedAt: Date; riskLevel: string; score: number; message: string }[];
  }> {
    // We query the risk_assessments table directly via raw query to avoid circular module deps
    const raw = await this.prenatalRepo.manager.query(
      `SELECT "submittedAt", "riskLevel", "score", "message"
       FROM risk_assessments
       WHERE "patientId" = $1
       ORDER BY "submittedAt" DESC
       LIMIT 50`,
      [patientId],
    );
    return { riskHistory: raw };
  }

  async updateNeonatal(id: string, dto: Partial<CreateNeonatalDto>, actorId?: string): Promise<NeonatalPatient> {
    const updateData: any = { ...dto };
    
    // Convert string numbers to actual numbers
    if (updateData.birthWeight && typeof updateData.birthWeight === 'string') {
      updateData.birthWeight = parseFloat(updateData.birthWeight);
    }
    if (updateData.birthLength && typeof updateData.birthLength === 'string') {
      updateData.birthLength = parseFloat(updateData.birthLength);
    }
    
    // Convert babyDob to dateOfBirth
    if (updateData.babyDob) {
      updateData.dateOfBirth = new Date(updateData.babyDob);
      delete updateData.babyDob;
    }
    
    await this.neonatalRepo.update(id, updateData);
    const updated = await this.findOneNeonatal(id);
    await this.activityLog.log({
      action: ActivityAction.PATIENT_UPDATED,
      actorId,
      description: `Neonatal patient ${updated.babyName} updated`,
      resourceType: 'neonatal_patient',
      resourceId: id,
    });
    return updated;
  }

  async deleteNeonatal(id: string, actorId?: string): Promise<void> {
    const patient = await this.findOneNeonatal(id);
    await this.neonatalRepo.remove(patient);
    await this.activityLog.log({
      action: ActivityAction.PATIENT_DELETED,
      actorId,
      description: `Neonatal patient ${patient.babyName} deleted`,
      resourceType: 'neonatal_patient',
      resourceId: id,
    });
  }

  // ── Notification helper ───────────────────────────────────────────────────

  private async _notifyDhosAndAdmins(title: string, body: string, excludeId?: string): Promise<void> {
    const [dhos, admins] = await Promise.all([
      this.usersService.findByRole(UserRole.DHO),
      this.usersService.findByRole(UserRole.ADMIN),
    ]);
    const ids = [...dhos, ...admins]
      .map(u => u.id)
      .filter(id => id !== excludeId);
    if (ids.length > 0) {
      await this.notificationsService.broadcast(ids, title, body, NotificationType.INFO);
    }
  }

  // ── Mobile account helpers ────────────────────────────────────────────────

  /**
   * Create or update a mobile User account for a patient.
   * If a user with the same phone already exists, update their password.
   * Otherwise create a new account and link it to the patient record.
   */
  private async _createOrUpdateMobileUser(opts: {
    phone: string;
    email?: string;
    password: string;
    role: UserRole.PRENATAL | UserRole.NEONATAL;
    fullName: string;
    age?: string;
    nationality?: string;
    district?: string;
    facilityName?: string;
    pregnancyMonths?: string;
    pregnancyWeeks?: string;
    expectedDeliveryDate?: string;
    lmpDate?: string;
    village?: string;
    gravida?: number;
    parity?: number;
    existingConditions?: string[];
    emergencyContact?: string;
    babyName?: string;
    babyDob?: string;
    babyGender?: string;
    babyBirthWeight?: string;
    patientId: string;
    patientRepo: Repository<PrenatalPatient | NeonatalPatient>;
    userIdField: string;
  }): Promise<void> {
    const existing = await this.usersService.findByEmailOrPhone(opts.phone);
    if (existing) {
      // Update password only
      await this.usersService.updatePassword(existing.id, opts.password);
      // Ensure patient is linked
      await opts.patientRepo.update(opts.patientId, { [opts.userIdField]: existing.id } as never);
    } else {
      // Create new mobile account
      const user = await this.usersService.create({
        phone:               opts.phone,
        email:               opts.email,
        password:            opts.password,
        role:                opts.role,
        fullName:            opts.fullName,
        age:                 opts.age,
        nationality:         opts.nationality,
        district:            opts.district,
        facilityName:        opts.facilityName,
        pregnancyMonths:     opts.pregnancyMonths,
        pregnancyWeeks:      opts.pregnancyWeeks,
        expectedDeliveryDate: opts.expectedDeliveryDate,
        lmpDate:             opts.lmpDate,
        village:             opts.village,
        gravida:             opts.gravida,
        parity:              opts.parity,
        existingConditions:  opts.existingConditions,
        emergencyContact:    opts.emergencyContact,
        babyName:            opts.babyName,
        babyDob:             opts.babyDob,
        babyGender:          opts.babyGender,
        babyBirthWeight:     opts.babyBirthWeight,
      });
      // Link patient to the new user
      await opts.patientRepo.update(opts.patientId, { [opts.userIdField]: user.id } as never);
    }
  }

  /** Reset password for the mobile account linked to a prenatal patient */
  async resetPrenatalPassword(patientId: string, newPassword: string): Promise<void> {
    const patient = await this.findOnePrenatal(patientId);
    if (!patient.userId) {
      throw new Error('This patient does not have a linked mobile account yet. Register with a password first.');
    }
    await this.usersService.updatePassword(patient.userId, newPassword);
  }

  /** Reset password for the mobile account linked to a neonatal patient */
  async resetNeonatalPassword(patientId: string, newPassword: string): Promise<void> {
    const patient = await this.findOneNeonatal(patientId);
    if (!patient.userId) {
      throw new Error('This patient does not have a linked mobile account yet. Register with a password first.');
    }
    await this.usersService.updatePassword(patient.userId, newPassword);
  }
}
