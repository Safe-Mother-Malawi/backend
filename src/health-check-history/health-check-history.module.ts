import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthCheckHistory } from './entities/health-check-history.entity';
import { HealthCheckHistoryService } from './health-check-history.service';
import { HealthCheckHistoryController } from './health-check-history.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { AlertsModule } from '../alerts/alerts.module';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { RiskAssessment } from '../risk-assessments/entities/risk-assessment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthCheckHistory, PrenatalPatient, NeonatalPatient, RiskAssessment]),
    ActivityLogModule,
    UsersModule,
    AlertsModule,
  ],
  providers: [HealthCheckHistoryService],
  controllers: [HealthCheckHistoryController],
  exports: [HealthCheckHistoryService],
})
export class HealthCheckHistoryModule {}
