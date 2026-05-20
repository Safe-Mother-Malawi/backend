import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(data: {
    email?: string;
    phone: string;
    password: string;
    role: UserRole;
    fullName: string;
    age?: string;
    nationality?: string;
    region?: string;
    zone?: string;
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
    securityQuestion?: string;
    securityAnswer?: string;
  }): Promise<User> {
    // Check uniqueness
    const existingPhone = await this.usersRepo.findOne({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new ConflictException('An account with this phone number already exists.');
    }

    if (data.email) {
      const existingEmail = await this.usersRepo.findOne({ where: { email: data.email } });
      if (existingEmail) {
        throw new ConflictException('An account with this email already exists.');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    let securityAnswerHash: string | null = null;
    if (data.securityAnswer) {
      securityAnswerHash = await bcrypt.hash(
        data.securityAnswer.toLowerCase().trim(),
        SALT_ROUNDS,
      );
    }

    const user = this.usersRepo.create({
      email: data.email || null,
      phone: data.phone,
      passwordHash,
      role: data.role,
      fullName: data.fullName,
      age: data.age || null,
      nationality: data.nationality || null,
      region: data.region || null,
      zone: data.zone || null,
      district: data.district || null,
      facilityName: data.facilityName || null,
      pregnancyMonths: data.pregnancyMonths || null,
      pregnancyWeeks: data.pregnancyWeeks || null,
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      lmpDate: data.lmpDate || null,
      village: data.village || null,
      gravida: data.gravida || null,
      parity: data.parity || null,
      existingConditions: data.existingConditions || null,
      emergencyContact: data.emergencyContact || null,
      babyName: data.babyName || null,
      babyDob: data.babyDob || null,
      babyGender: data.babyGender || null,
      babyBirthWeight: data.babyBirthWeight || null,
      securityQuestion: data.securityQuestion || null,
      securityAnswerHash,
    });

    return this.usersRepo.save(user);
  }

  // ── Finders ───────────────────────────────────────────────────────────────

  async findByRole(role: UserRole): Promise<User[]> {
    return this.usersRepo.find({ where: { role } });
  }

  async findCliniciansByFacility(facility: string): Promise<User[]> {
    return this.usersRepo.find({
      where: {
        role: UserRole.CLINICIAN,
        facilityName: facility,
        isActive: true,
      },
      order: { fullName: 'ASC' },
    });
  }

  async findAll(filters?: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
    district?: string;
  }): Promise<User[]> {
    const qb = this.usersRepo.createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC');

    if (filters?.role) qb.andWhere('u.role = :role', { role: filters.role });
    if (filters?.isActive !== undefined) qb.andWhere('u.isActive = :isActive', { isActive: filters.isActive });
    if (filters?.district) qb.andWhere('u.district = :district', { district: filters.district });
    if (filters?.search) {
      qb.andWhere(
        '(LOWER(u.fullName) LIKE :s OR LOWER(u.email) LIKE :s OR u.phone LIKE :s)',
        { s: `%${filters.search.toLowerCase()}%` },
      );
    }
    return qb.getMany();
  }

  async updateUser(id: string, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    age?: string;
    nationality?: string;
    region?: string;
    zone?: string;
    district?: string;
    facility?: string;
    facilityName?: string;
    role?: UserRole;
    // Prenatal fields
    pregnancyMonths?: string;
    pregnancyWeeks?: string;
    expectedDeliveryDate?: string;
    lmpDate?: string;
    // Neonatal fields
    babyName?: string;
    babyDob?: string;
    babyGender?: string;
    babyBirthWeight?: string;
  }): Promise<User> {
    // Map 'facility' to the entity column name 'facilityName' if provided
    const { facility, ...rest } = data;
    const update: Partial<User> = { ...rest };
    if (facility !== undefined) update.facilityName = facility;
    
    // Validate phone uniqueness if phone is being updated
    if (data.phone) {
      const existingPhone = await this.usersRepo.findOne({ 
        where: { phone: data.phone } 
      });
      if (existingPhone && existingPhone.id !== id) {
        throw new ConflictException('An account with this phone number already exists.');
      }
    }
    
    // Validate email uniqueness if email is being updated
    if (data.email) {
      const existingEmail = await this.usersRepo.findOne({ 
        where: { email: data.email } 
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('An account with this email already exists.');
      }
    }
    
    await this.usersRepo.update(id, update);
    return this.findByIdOrThrow(id);
  }

  async updatePassword(id: string, newPassword: string, adminId?: string): Promise<void> {
    const user = await this.findByIdOrThrow(id);
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepo.update(id, { passwordHash });

    // Notify admins — never include the plain password in notifications
    try {
      if (adminId) {
        await this.notificationsService.notifyAdmins(
          'Admin Password Reset',
          `Admin reset the password for ${user.fullName} (${user.role}).`,
          NotificationType.ALERT,
        );
      } else {
        await this.notificationsService.notifyAdmins(
          'User Password Change',
          `${user.fullName} (${user.role}) changed their password.`,
          NotificationType.INFO,
        );
      }
    } catch (error) {
      console.error('Failed to notify admins of password change:', error);
    }
  }

  /** Returns the plain-text password — only possible because we store it temporarily.
   *  Since passwords are hashed we cannot reverse them; instead we expose a
   *  one-time reset: admin/DHO sets a new known password for the user. */
  async getPasswordForAdmin(id: string): Promise<{ phone: string; note: string }> {
    const user = await this.findByIdOrThrow(id);
    // We cannot decrypt bcrypt — return the phone (used as login identifier)
    // and a note. The admin action is to SET a new password, not read the old one.
    return { phone: user.phone, note: 'Passwords are hashed and cannot be read. Use "Reset Password" to set a new one.' };
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    await this.usersRepo.update(id, { isActive });
    return this.findByIdOrThrow(id);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findByIdOrThrow(id);
    await this.usersRepo.remove(user);
  }

  async touchLastActive(id: string): Promise<void> {
    await this.usersRepo.update(id, { lastActiveAt: new Date() });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    if (identifier.includes('@')) {
      return this.usersRepo.findOne({ where: { email: identifier } });
    }
    return this.usersRepo.findOne({ where: { phone: identifier } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // ── Refresh token ─────────────────────────────────────────────────────────

  async setRefreshToken(userId: string, token: string | null): Promise<void> {
    const hash = token ? await bcrypt.hash(token, SALT_ROUNDS) : null;
    await this.usersRepo.update(userId, { refreshTokenHash: hash });
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user?.refreshTokenHash) return false;
    return bcrypt.compare(token, user.refreshTokenHash);
  }

  // ── Password reset ────────────────────────────────────────────────────────

  async getSecurityQuestion(identifier: string): Promise<string | null> {
    const user = await this.findByEmailOrPhone(identifier);
    return user?.securityQuestion ?? null;
  }

  async resetPassword(data: {
    identifier: string;
    securityAnswer: string;
    newPassword: string;
  }): Promise<boolean> {
    const user = await this.findByEmailOrPhone(data.identifier);
    if (!user?.securityAnswerHash) return false;

    const match = await bcrypt.compare(
      data.securityAnswer.toLowerCase().trim(),
      user.securityAnswerHash,
    );
    if (!match) return false;

    const passwordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
    await this.usersRepo.update(user.id, { passwordHash });
    return true;
  }

  // ── Validate password ─────────────────────────────────────────────────────

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  // ── Password Reset Token Management ───────────────────────────────────────

  async invalidateAllSessions(userId: string): Promise<void> {
    // Invalidate all refresh tokens for this user
    await this.usersRepo.update(userId, { refreshTokenHash: null });
  }

  // ── User Preferences ──────────────────────────────────────────────────────

  async getPreferences(userId: string): Promise<Record<string, any>> {
    const user = await this.findByIdOrThrow(userId);
    return user.preferences || {};
  }

  async savePreferences(userId: string, preferences: Record<string, any>): Promise<Record<string, any>> {
    await this.usersRepo.update(userId, { preferences });
    return this.getPreferences(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.findByIdOrThrow(userId);
    const isValid = await this.validatePassword(user, currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    await this.updatePassword(userId, newPassword);
  }

  // ── Profile Photo Management ──────────────────────────────────────────────

  async updateProfilePhoto(userId: string, photoUrl: string | null): Promise<User> {
    await this.usersRepo.update(userId, { profilePhotoUrl: photoUrl });
    return this.findByIdOrThrow(userId);
  }

  async getProfilePhoto(userId: string): Promise<string | null> {
    const user = await this.findByIdOrThrow(userId);
    return user.profilePhotoUrl;
  }
}

