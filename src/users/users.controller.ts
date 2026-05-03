import {
  Controller, Get, Post, Patch, Delete, Put, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateDhoDto, CreateClinicianDto, UpdateStaffUserDto } from './dto/create-staff-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly activityLog: ActivityLogService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  private sanitize(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, securityAnswerHash, ...safe } = user;
    return safe;
  }

  /**
   * Ensure a DHO can only act on clinicians within their own district.
   */
  private async assertDhoScope(actor: User, targetId: string): Promise<User> {
    const target = await this.usersService.findByIdOrThrow(targetId);

    if (actor.role === UserRole.DHO) {
      if (target.role !== UserRole.CLINICIAN) {
        throw new ForbiddenException('DHOs can only manage clinician accounts.');
      }
      if (target.district && actor.district && target.district !== actor.district) {
        throw new ForbiddenException('DHOs can only manage clinicians within their own district.');
      }
    }

    return target;
  }

  // ── GET /users ────────────────────────────────────────────────────────────
  /**
   * Admin → sees all staff (admin, dho, clinician), filterable.
   * DHO   → sees only clinicians in their own district.
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async findAll(
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @CurrentUser() actor?: User,
  ) {
    const filters: { role?: UserRole; isActive?: boolean; search?: string; district?: string } = {};

    if (actor?.role === UserRole.DHO) {
      // DHO is locked to clinicians in their district — ignore any role/district query params
      filters.role = UserRole.CLINICIAN;
      if (actor.district) filters.district = actor.district;
    } else {
      // Admin can filter freely
      if (role) filters.role = role;
    }

    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const users = await this.usersService.findAll(filters);
    return users.map((u) => this.sanitize(u));
  }

  // ── GET /users/patients ───────────────────────────────────────────────────
  /**
   * Admin → sees all mobile patient accounts (prenatal + neonatal).
   * Useful for the system users list to show self-registered patients.
   */
  @Get('patients')
  @Roles(UserRole.ADMIN, UserRole.DHO, UserRole.CLINICIAN)
  async findPatientUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: { role?: UserRole; isActive?: boolean; search?: string } = {};

    // Allow filtering by prenatal or neonatal, default to both
    if (role === 'prenatal') {
      filters.role = UserRole.PRENATAL;
    } else if (role === 'neonatal') {
      filters.role = UserRole.NEONATAL;
    }

    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    // If no specific role filter, fetch both prenatal and neonatal
    if (!filters.role) {
      const [prenatal, neonatal] = await Promise.all([
        this.usersService.findAll({ ...filters, role: UserRole.PRENATAL }),
        this.usersService.findAll({ ...filters, role: UserRole.NEONATAL }),
      ]);
      return [...prenatal, ...neonatal].map((u) => this.sanitize(u));
    }

    const users = await this.usersService.findAll(filters);
    return users.map((u) => this.sanitize(u));
  }

  // ── GET /users/clinicians-by-facility ─────────────────────────────────────
  /**
   * Fetch all active clinicians for a specific facility.
   * Used by appointment creation to populate the nurse/provider dropdown.
   * Query params: facility (required)
   */
  @Get('clinicians-by-facility')
  @Roles(UserRole.ADMIN, UserRole.DHO, UserRole.CLINICIAN, UserRole.PRENATAL, UserRole.NEONATAL)
  async findCliniciansByFacility(@Query('facility') facility?: string) {
    if (!facility) {
      return [];
    }
    const clinicians = await this.usersService.findCliniciansByFacility(facility);
    return clinicians.map((u) => this.sanitize(u));
  }

  // ── GET /users/:id ────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async findOne(@Param('id') id: string, @CurrentUser() actor: User) {
    if (actor.role === UserRole.DHO) {
      await this.assertDhoScope(actor, id);
    }
    return this.sanitize(await this.usersService.findByIdOrThrow(id));
  }

  // ── POST /users (Admin only) — creates admin or dho ───────────────────────
  /**
   * Only admins can create admin/dho accounts.
   * Endpoint: POST /users/dho
   */
  @Post('dho')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createDho(@Body() dto: CreateDhoDto, @CurrentUser() actor: User) {
    const user = await this.usersService.create({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: dto.role,           // admin | dho — validated by DTO
      fullName: dto.fullName,
      region: dto.region,
      zone: dto.zone,
      district: dto.district,
      facilityName: dto.facility,
    });

    await this.activityLog.log({
      action: ActivityAction.USER_REGISTERED,
      actorId: actor.id,
      description: `Admin created ${dto.role.toUpperCase()} account for ${dto.fullName}`,
      resourceType: 'user',
      resourceId: user.id,
      meta: { role: dto.role, region: dto.region, zone: dto.zone, district: dto.district, createdBy: actor.email },
    });

    return this.sanitize(user);
  }

  // ── POST /users/clinician (DHO only) — creates clinician ─────────────────
  /**
   * Only DHOs can create clinician accounts.
   * The clinician is automatically assigned to the DHO's district.
   * Endpoint: POST /users/clinician
   */
  @Post('clinician')
  @Roles(UserRole.DHO)
  @HttpCode(HttpStatus.CREATED)
  async createClinician(@Body() dto: CreateClinicianDto, @CurrentUser() actor: User) {
    // Clinician inherits DHO's district if not explicitly provided
    const district = dto.district || actor.district || undefined;

    if (!district) {
      throw new BadRequestException('District is required. Your DHO account has no district assigned.');
    }

    const user = await this.usersService.create({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: UserRole.CLINICIAN,   // always clinician — enforced here
      fullName: dto.fullName,
      district,
      facilityName: dto.facility,
    });

    await this.activityLog.log({
      action: ActivityAction.USER_REGISTERED,
      actorId: actor.id,
      description: `DHO (${actor.district}) created clinician account for ${dto.fullName}`,
      resourceType: 'user',
      resourceId: user.id,
      meta: { role: UserRole.CLINICIAN, district, createdBy: actor.email },
    });

    return this.sanitize(user);
  }

  // ── PATCH /users/:id ──────────────────────────────────────────────────────
  /**
   * Admin → can update any staff account.
   * DHO   → can only update clinicians in their district.
   *         DHO cannot change a clinician's role or move them to another district.
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffUserDto,
    @CurrentUser() actor: User,
  ) {
    if (actor.role === UserRole.DHO) {
      await this.assertDhoScope(actor, id);

      // DHO cannot change role or district
      if (dto.role && dto.role !== UserRole.CLINICIAN) {
        throw new ForbiddenException('DHOs cannot change a clinician\'s role.');
      }
      if (dto.district && dto.district !== actor.district) {
        throw new ForbiddenException('DHOs cannot move clinicians to a different district.');
      }
      // Lock district to DHO's district
      dto.district = actor.district ?? dto.district;
      dto.role = undefined; // prevent role change
    }

    const user = await this.usersService.updateUser(id, {
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      district: dto.district,
      facility: dto.facility,
      role: dto.role,
    });

    await this.activityLog.log({
      action: ActivityAction.USER_ACTIVATED,
      actorId: actor.id,
      description: `${actor.role.toUpperCase()} updated user ${user.fullName}`,
      resourceType: 'user',
      resourceId: id,
    });

    return this.sanitize(user);
  }

  // ── PATCH /users/:id/status ───────────────────────────────────────────────
  /**
   * Admin → can activate/deactivate any account.
   * DHO   → can only activate/deactivate clinicians in their district.
   */
  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async setStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() actor: User,
  ) {
    if (actor.role === UserRole.DHO) {
      await this.assertDhoScope(actor, id);
    }

    const user = await this.usersService.setActive(id, isActive);

    await this.activityLog.log({
      action: isActive ? ActivityAction.USER_ACTIVATED : ActivityAction.USER_DEACTIVATED,
      actorId: actor.id,
      description: `${actor.role.toUpperCase()} ${isActive ? 'activated' : 'deactivated'} ${user.fullName}`,
      resourceType: 'user',
      resourceId: id,
    });

    return this.sanitize(user);
  }

  // ── PATCH /users/:id/password ─────────────────────────────────────────────
  /**
   * Admin → can reset any user's password.
   * DHO   → can only reset passwords of clinicians in their district.
   */
  @Patch(':id/password')
  @Roles(UserRole.ADMIN, UserRole.DHO)
  async resetUserPassword(
    @Param('id') id: string,
    @Body('password') password: string,
    @CurrentUser() actor: User,
  ) {
    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters.');
    }
    if (actor.role === UserRole.DHO) {
      await this.assertDhoScope(actor, id);
    }
    await this.usersService.updatePassword(id, password, actor.id);
    await this.activityLog.log({
      action: ActivityAction.USER_ACTIVATED,
      actorId: actor.id,
      description: `${actor.role.toUpperCase()} reset password for user ${id}`,
      resourceType: 'user',
      resourceId: id,
    });
    return { success: true };
  }

  // ── DELETE /users/:id (Admin only) ────────────────────────────────────────
  /**
   * Only admins can permanently delete accounts.
   * Admins cannot delete themselves.
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() actor: User) {
    if (actor.id === id) {
      throw new ForbiddenException('You cannot delete your own account.');
    }
    const user = await this.usersService.findByIdOrThrow(id);
    await this.usersService.deleteUser(id);
    await this.activityLog.log({
      action: ActivityAction.USER_DEACTIVATED,
      actorId: actor.id,
      description: `Admin permanently deleted user ${user.fullName} (${user.role})`,
      resourceType: 'user',
      resourceId: id,
    });
  }

  // ── GET /users/me/preferences ─────────────────────────────────────────────
  /**
   * Get current user's preferences
   */
  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  async getMyPreferences(@CurrentUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  // ── PUT /users/me/preferences ─────────────────────────────────────────────
  /**
   * Save current user's preferences
   */
  @Put('me/preferences')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async saveMyPreferences(@CurrentUser() user: User, @Body() preferences: Record<string, any>) {
    return this.usersService.savePreferences(user.id, preferences);
  }

  // ── DELETE /users/me ──────────────────────────────────────────────────────
  /**
   * Delete current user's account
   */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: User) {
    await this.usersService.deleteUser(user.id);
    await this.activityLog.log({
      action: ActivityAction.USER_DEACTIVATED,
      actorId: user.id,
      description: `User ${user.fullName} deleted their own account`,
      resourceType: 'user',
      resourceId: user.id,
    });
  }
}
