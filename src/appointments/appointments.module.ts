import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { ANCController } from './anc.controller';
import { ANCTrackingService } from './services/anc-tracking.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';
import { AlertsModule } from '../alerts/alerts.module';
import { RemindersModule } from '../reminders/reminders.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, PrenatalPatient, NeonatalPatient]),
    NotificationsModule,
    UsersModule,
    RiskEngineModule,
    AlertsModule,
    RemindersModule,
    ActivityLogModule,
    forwardRef(() => AnalyticsModule),
  ],
  providers: [AppointmentsService, ANCTrackingService],
  controllers: [AppointmentsController, ANCController],
  exports: [AppointmentsService, ANCTrackingService],
})
export class AppointmentsModule {}
