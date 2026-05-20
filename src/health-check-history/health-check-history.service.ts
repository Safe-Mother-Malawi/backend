import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthCheckHistory, HealthCheckType } from './entities/health-check-history.entity';
import { CreateHealthCheckHistoryDto } from './dto/create-health-check-history.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class HealthCheckHistoryService {
  constructor(
    @InjectRepository(HealthCheckHistory)
    private readonly repo: Repository<HealthCheckHistory>,
    private readonly activityLog: ActivityLogService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new health check history record
   * @param dto Health check data
   * @param user Current user (patient)
   * @param submittedBy Optional clinician who submitted on behalf of patient
   */
  async create(
    dto: CreateHealthCheckHistoryDto,
    user: User,
    submittedBy?: User,
  ): Promise<HealthCheckHistory> {
    if (!this.isPatient(user)) {
      throw new ForbiddenException('Only prenatal and neonatal patients can create health check records.');
    }

    const expectedType = user.role === UserRole.PRENATAL ? HealthCheckType.PRENATAL : HealthCheckType.NEONATAL;
    if (dto.type !== expectedType) {
      throw new BadRequestException(
        `Health check type must be ${expectedType} for ${user.role} users.`,
      );
    }

    // Validate score is within max score
    if (dto.score > dto.maxScore) {
      throw new BadRequestException('Score cannot exceed maxScore.');
    }

    console.log('=== HEALTH CHECK HISTORY CREATE ===');
    console.log('User:', user.id, user.role);
    console.log('Type:', dto.type);
    console.log('Risk Level:', dto.riskLevel);
    console.log('Score:', dto.score, '/', dto.maxScore);
    console.log('Symptoms received:', dto.symptoms);
    console.log('Symptoms count:', dto.symptoms?.length ?? 0);
    console.log('=== END LOG ===');

    const record = this.repo.create({
      type: dto.type,
      riskLevel: dto.riskLevel,
      score: dto.score,
      maxScore: dto.maxScore,
      percentage: dto.percentage,
      message: dto.message,
      symptoms: dto.symptoms ?? null,
      answers: dto.answers ?? null,
      userId: user.id,
      submittedById: submittedBy?.id || null,
    });

    const saved = await this.repo.save(record);

    // Log the activity
    await this.activityLog.log({
      action: ActivityAction.HEALTH_CHECK_SUBMITTED,
      actorId: submittedBy?.id || user.id,
      description: `${dto.type} health check submitted: ${dto.riskLevel} (score ${dto.score}/${dto.maxScore})`,
      resourceType: 'health_check_history',
      resourceId: saved.id,
      meta: {
        riskLevel: dto.riskLevel,
        score: dto.score,
        maxScore: dto.maxScore,
        percentage: dto.percentage,
        type: dto.type,
      },
    });

    return saved;
  }

  async createForUser(
    userId: string,
    dto: CreateHealthCheckHistoryDto,
    submittedBy: User,
  ): Promise<HealthCheckHistory> {
    if (!this.isStaff(submittedBy)) {
      throw new ForbiddenException('Only staff can submit health checks for another user.');
    }

    const targetUser = await this.usersService.findByIdOrThrow(userId);
    return this.create(dto, targetUser, submittedBy);
  }

  /**
   * Get health check history for a specific user
   * Returns records in reverse chronological order (newest first)
   * @param userId User ID to fetch history for
   * @param limit Maximum number of records to return (default: 50)
   * @param offset Pagination offset (default: 0)
   */
  async findByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: HealthCheckHistory[]; total: number }> {
    if (limit > 100) limit = 100; // Cap at 100 for performance
    if (limit < 1) limit = 1;
    if (offset < 0) offset = 0;

    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  /**
   * Get a single health check record by ID
   */
  async findOne(id: string): Promise<HealthCheckHistory> {
    const record = await this.repo.findOne({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Health check record not found.');
    }

    return record;
  }

  async findOneForUser(id: string, currentUser: User): Promise<HealthCheckHistory> {
    const record = await this.findOne(id);
    if (!this.canReadUserHistory(currentUser, record.userId)) {
      throw new ForbiddenException('You can only access your own health check history.');
    }
    return record;
  }

  /**
   * Get the latest health check for a user
   */
  async findLatest(userId: string): Promise<HealthCheckHistory | null> {
    return this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestForUser(userId: string, currentUser: User): Promise<HealthCheckHistory | null> {
    if (!this.canReadUserHistory(currentUser, userId)) {
      throw new ForbiddenException('You can only access your own health check history.');
    }
    return this.findLatest(userId);
  }

  /**
   * Get health check history for a user by type (prenatal or neonatal)
   */
  async findByUserAndType(
    userId: string,
    type: HealthCheckType,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: HealthCheckHistory[]; total: number }> {
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 1;
    if (offset < 0) offset = 0;

    const [data, total] = await this.repo.findAndCount({
      where: { userId, type },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  /**
   * Get health check statistics for a user
   * Returns count of records by risk level
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    byRiskLevel: Record<string, number>;
    latest: HealthCheckHistory | null;
  }> {
    const byRiskLevel: Record<string, number> = {
      'Low Risk': 0,
      'Moderate Risk': 0,
      'High Risk': 0,
      'Seek Help Immediately': 0,
    };

    const grouped = await this.repo
      .createQueryBuilder('history')
      .select('history.riskLevel', 'riskLevel')
      .addSelect('COUNT(*)', 'count')
      .where('history.userId = :userId', { userId })
      .groupBy('history.riskLevel')
      .getRawMany<{ riskLevel: string; count: string }>();

    let total = 0;
    for (const row of grouped) {
      const count = Number(row.count);
      byRiskLevel[row.riskLevel] = count;
      total += count;
    }

    return {
      total,
      byRiskLevel,
      latest: await this.findLatest(userId),
    };
  }

  /**
   * Delete a health check record (admin only)
   */
  async delete(id: string): Promise<void> {
    const record = await this.findOne(id);
    await this.repo.remove(record);

    await this.activityLog.log({
      action: ActivityAction.HEALTH_CHECK_DELETED,
      description: `Health check record deleted: ${record.riskLevel}`,
      resourceType: 'health_check_history',
      resourceId: id,
    });
  }

  /**
   * Get all health check records (admin only)
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<{ data: HealthCheckHistory[]; total: number }> {
    if (limit > 100) limit = 100;
    if (limit < 1) limit = 1;
    if (offset < 0) offset = 0;

    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { data, total };
  }

  canReadUserHistory(currentUser: User, userId: string): boolean {
    return this.isStaff(currentUser) || currentUser.id === userId;
  }

  private isStaff(user: User): boolean {
    return [UserRole.CLINICIAN, UserRole.DHO, UserRole.ADMIN].includes(user.role);
  }

  private isPatient(user: User): boolean {
    return user.role === UserRole.PRENATAL || user.role === UserRole.NEONATAL;
  }
}
