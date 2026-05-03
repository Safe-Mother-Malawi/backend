import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrenatalPatient } from './entities/prenatal-patient.entity';
import { NeonatalPatient } from './entities/neonatal-patient.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { TrackingModule } from '../tracking/tracking.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrenatalPatient, NeonatalPatient]),
    TrackingModule,
    ActivityLogModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [PatientsService],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
