import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthFacility } from './entities/health-facility.entity';
import { HealthFacilitiesService } from './health-facilities.service';
import { HealthFacilitiesController } from './health-facilities.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { User } from '../users/entities/user.entity';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthFacility, User, PrenatalPatient, NeonatalPatient, Appointment]), 
    ActivityLogModule
  ],
  providers: [HealthFacilitiesService],
  controllers: [HealthFacilitiesController],
  exports: [HealthFacilitiesService],
})
export class HealthFacilitiesModule {}
