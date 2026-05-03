import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskAssessment } from './entities/risk-assessment.entity';
import { RiskAssessmentsService } from './risk-assessments.service';
import { RiskAssessmentsController } from './risk-assessments.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { IvrModule } from '../ivr/ivr.module';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RiskAssessment, PrenatalPatient, NeonatalPatient]),
    AlertsModule,
    NotificationsModule,
    ActivityLogModule,
    UsersModule,
    forwardRef(() => IvrModule),
  ],
  providers: [RiskAssessmentsService],
  controllers: [RiskAssessmentsController],
  exports: [RiskAssessmentsService],
})
export class RiskAssessmentsModule {}
