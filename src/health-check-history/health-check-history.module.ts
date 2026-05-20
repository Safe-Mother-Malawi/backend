import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckHistory } from './entities/health-check-history.entity';
import { HealthCheckHistoryService } from './health-check-history.service';
import { HealthCheckHistoryController } from './health-check-history.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthCheckHistory]),
    ActivityLogModule,
    UsersModule,
  ],
  providers: [HealthCheckHistoryService],
  controllers: [HealthCheckHistoryController],
  exports: [HealthCheckHistoryService],
})
export class HealthCheckHistoryModule {}
