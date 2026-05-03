import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityAction } from './entities/activity-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
  ) {}

  async log(data: {
    action: ActivityAction;
    actorId?: string;
    description?: string;
    resourceType?: string;
    resourceId?: string;
    meta?: Record<string, unknown>;
  }): Promise<void> {
    const entry = this.repo.create({
      action: data.action,
      actorId: data.actorId ?? null,
      description: data.description ?? null,
      resourceType: data.resourceType ?? null,
      resourceId: data.resourceId ?? null,
      meta: data.meta ?? null,
    });
    await this.repo.save(entry);
  }

  async findAll(opts?: { since?: Date; limit?: number }): Promise<ActivityLog[]> {
    const qb = this.repo.createQueryBuilder('l')
      .leftJoinAndSelect('l.actor', 'actor')
      .orderBy('l.createdAt', 'DESC')
      .take(opts?.limit ?? 100);
    if (opts?.since) {
      qb.where('l.createdAt >= :since', { since: opts.since });
    }
    return qb.getMany();
  }

  async findByActor(actorId: string): Promise<ActivityLog[]> {
    return this.repo.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByResource(resourceType: string, resourceId: string): Promise<ActivityLog[]> {
    return this.repo.find({
      where: { resourceType, resourceId },
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }
}
