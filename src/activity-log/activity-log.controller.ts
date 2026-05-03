import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DHO)
@Controller('activity-logs')
export class ActivityLogController {
  constructor(private readonly service: ActivityLogService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.service.findAll({ limit: limit ? parseInt(limit, 10) : 100 });
  }

  @Get('actor/:actorId')
  findByActor(@Param('actorId') actorId: string) {
    return this.service.findByActor(actorId);
  }

  @Get(':resourceType/:resourceId')
  findByResource(
    @Param('resourceType') resourceType: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.service.findByResource(resourceType, resourceId);
  }
}
