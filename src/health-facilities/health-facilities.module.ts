import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthFacility } from './entities/health-facility.entity';
import { HealthFacilitiesService } from './health-facilities.service';
import { HealthFacilitiesController } from './health-facilities.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([HealthFacility]), ActivityLogModule],
  providers: [HealthFacilitiesService],
  controllers: [HealthFacilitiesController],
  exports: [HealthFacilitiesService],
})
export class HealthFacilitiesModule {}
