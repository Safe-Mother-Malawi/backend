import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ── Feature modules ───────────────────────────────────────────────────────────
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { RiskAssessmentsModule } from './risk-assessments/risk-assessments.module';
import { RiskEngineModule } from './risk-engine/risk-engine.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TrackingModule } from './tracking/tracking.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { ContactModule } from './contact/contact.module';
import { HealthFacilitiesModule } from './health-facilities/health-facilities.module';
import { WhoQuestionsModule } from './who-questions/who-questions.module';
import { IvrModule } from './ivr/ivr.module';

// ── Entities ──────────────────────────────────────────────────────────────────
import { User } from './users/entities/user.entity';
import { PrenatalPatient } from './patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from './patients/entities/neonatal-patient.entity';
import { RiskAssessment } from './risk-assessments/entities/risk-assessment.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Alert } from './alerts/entities/alert.entity';
import { Notification } from './notifications/entities/notification.entity';
import { FeedingLog } from './tracking/entities/feeding-log.entity';
import { SleepLog } from './tracking/entities/sleep-log.entity';
import { Vaccine } from './tracking/entities/vaccine.entity';
import { ActivityLog } from './activity-log/entities/activity-log.entity';
import { Report } from './reports/entities/report.entity';
import { HealthFacility } from './health-facilities/entities/health-facility.entity';
import { WhoQuestion } from './who-questions/entities/who-question.entity';
import { IvrCallLog } from './ivr/entities/ivr-call-log.entity';
import { SmsInboxMessage } from './ivr/entities/sms-inbox.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';

// ── Middleware ────────────────────────────────────────────────────────────────
import { LastActiveMiddleware } from './common/middleware/last-active.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'safemothermalawi'),
        entities: [
          User, PrenatalPatient, NeonatalPatient,
          RiskAssessment, Appointment, Alert, Notification,
          FeedingLog, SleepLog, Vaccine, ActivityLog, Report, HealthFacility, WhoQuestion, IvrCallLog, SmsInboxMessage,
          PasswordResetToken,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
        // SSL configuration for Supabase and other cloud databases
        ssl: configService.get<string>('DB_HOST', 'localhost') !== 'localhost'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // Order matters — ActivityLogModule first (others depend on it)
    ActivityLogModule,
    UsersModule,
    AuthModule,
    PatientsModule,
    RiskAssessmentsModule,
    RiskEngineModule,
    AppointmentsModule,
    AlertsModule,
    NotificationsModule,
    TrackingModule,
    AnalyticsModule,
    ReportsModule,
    ContactModule,
    HealthFacilitiesModule,
    WhoQuestionsModule,
    IvrModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LastActiveMiddleware).forRoutes('*');
  }
}
