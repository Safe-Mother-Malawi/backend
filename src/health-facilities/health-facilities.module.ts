import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthFacility } from './entities/health-facility.entity';
import { HealthFacilitiesService } from './health-facilities.service';
import { HealthFacilitiesController } from './health-facilities.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HealthFacility])],
  providers: [HealthFacilitiesService],
  controllers: [HealthFacilitiesController],
  exports: [HealthFacilitiesService],
})
export class HealthFacilitiesModule {}
