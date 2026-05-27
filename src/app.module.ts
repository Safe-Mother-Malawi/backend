import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ── Feature modules ───────────────────────────────────────────────────────────
import { ActivityLogModule } from './activity-log/activity-log.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UsersSeedService } from './users/seed/users.seed';
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
import { EventsModule } from './events/events.module';
import { RemindersModule } from './reminders/reminders.module';
import { HealthCheckHistoryModule } from './health-check-history/health-check-history.module';
import { PushNotificationsModule } from './push-notifications/push-notifications.module';
import { FirebaseModule } from './firebase/firebase.module';
import { ReferralsModule } from './referrals/referrals.module';

// ── Entities ──────────────────────────────────────────────────────────────────
import { User } from './users/entities/user.entity';
import { PrenatalPatient } from './patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from './patients/entities/neonatal-patient.entity';
import { NeonatalVisit } from './patients/entities/neonatal-visit.entity';
import { RiskAssessment } from './risk-assessments/entities/risk-assessment.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { Alert } from './alerts/entities/alert.entity';
import { Notification } from './notifications/entities/notification.entity';
import { BroadcastMessage } from './notifications/entities/broadcast-message.entity';
import { FeedingLog } from './tracking/entities/feeding-log.entity';
import { SleepLog } from './tracking/entities/sleep-log.entity';
import { Vaccine } from './tracking/entities/vaccine.entity';
import { ActivityLog } from './activity-log/entities/activity-log.entity';
import { Report } from './reports/entities/report.entity';
import { HealthFacility } from './health-facilities/entities/health-facility.entity';
import { WhoQuestion } from './who-questions/entities/who-question.entity';
import { HealthCheckHistory } from './health-check-history/entities/health-check-history.entity';
import { DeviceToken } from './push-notifications/entities/device-token.entity';
import { Reminder } from './reminders/entities/reminder.entity';
import { Nationality } from './nationalities/entities/nationality.entity';
import { Referral } from './referrals/entities/referral.entity';

import { PasswordResetToken } from './auth/entities/password-reset-token.entity';

// ── Middleware ────────────────────────────────────────────────────────────────
import { LastActiveMiddleware } from './common/middleware/last-active.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5000, // Increased to 5000 requests per minute for better concurrency
    }]),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }
        
        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [
            User, PrenatalPatient, NeonatalPatient, NeonatalVisit,
            RiskAssessment, Appointment, Alert, Notification, BroadcastMessage,
            FeedingLog, SleepLog, Vaccine, ActivityLog, Report, HealthFacility, WhoQuestion,
            HealthCheckHistory, DeviceToken, Reminder, Nationality, Referral,
            PasswordResetToken,
          ],
          synchronize: true, // Auto-create tables (set to false after first successful deployment)
          logging: configService.get<string>('NODE_ENV') === 'development',
          ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        };
      },
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
    PushNotificationsModule,
    TrackingModule,
    AnalyticsModule,
    ReportsModule,
    ContactModule,
    HealthFacilitiesModule,
    WhoQuestionsModule,
    EventsModule,
    RemindersModule,
    HealthCheckHistoryModule,
    FirebaseModule,
    ReferralsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  constructor(
    private readonly usersSeedService: UsersSeedService,
  ) {}

  async onModuleInit() {
    // Seed default users on first startup
    await this.usersSeedService.seed();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LastActiveMiddleware).forRoutes('*');
  }
}
