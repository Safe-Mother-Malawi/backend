import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { RiskAssessment } from '../risk-assessments/entities/risk-assessment.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { IvrModule } from '../ivr/ivr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PrenatalPatient, NeonatalPatient, RiskAssessment, Alert]),
    forwardRef(() => IvrModule),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
