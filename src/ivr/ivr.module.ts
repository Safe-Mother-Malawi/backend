import { Module, forwardRef, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IvrController } from './ivr.controller';
import { IvrAnalyticsController } from './ivr-analytics.controller';
import { TwilioIvrController } from './twilio-ivr.controller';
import { IvrService } from './ivr.service';
import { TwilioIvrService } from './twilio-ivr.service';
import { IvrSimulatorService } from './ivr-simulator.service';
import { IvrAlertsGateway } from './ivr-alerts.gateway';
import { IvrSessionStore } from './ivr-session.store';
import { IvrCallLogService } from './ivr-call-log.service';
import { IvrLanguageService } from './services/ivr-language.service';
import { EmergencyService } from './services/emergency.service';
import { IvrCallLog } from './entities/ivr-call-log.entity';
import { SmsInboxService } from './sms-inbox.service';
import { SmsInboxMessage } from './entities/sms-inbox.entity';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { RiskAssessmentsModule } from '../risk-assessments/risk-assessments.module';
import { RiskAssessment } from '../risk-assessments/entities/risk-assessment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([IvrCallLog, RiskAssessment, SmsInboxMessage]),
    RiskEngineModule,
    PatientsModule,
    forwardRef(() => AppointmentsModule),
    forwardRef(() => RiskAssessmentsModule),
    NotificationsModule,
    UsersModule,
    forwardRef(() => AlertsModule),
  ],
  controllers: [IvrController, IvrAnalyticsController, TwilioIvrController],
  providers: [IvrService, TwilioIvrService, IvrSimulatorService, IvrAlertsGateway, IvrSessionStore, IvrCallLogService, IvrLanguageService, EmergencyService, SmsInboxService],
  exports: [IvrService, TwilioIvrService, IvrSimulatorService, IvrAlertsGateway, IvrCallLogService, IvrLanguageService, EmergencyService, SmsInboxService],
})
export class IvrModule implements OnModuleInit {
  private readonly logger = new Logger(IvrModule.name);
  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    // Check Twilio config
    const twilioAccountSid = this.config.get<string>('TWILIO_ACCOUNT_SID', '');
    const twilioAuthToken  = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    const twilioPhone      = this.config.get<string>('TWILIO_PHONE_NUMBER', '');
    const twilioMissing: string[] = [];
    if (!twilioAccountSid) twilioMissing.push('TWILIO_ACCOUNT_SID');
    if (!twilioAuthToken)  twilioMissing.push('TWILIO_AUTH_TOKEN');
    if (!twilioPhone)      twilioMissing.push('TWILIO_PHONE_NUMBER');
    if (twilioMissing.length > 0) {
      this.logger.warn(`Twilio: missing env vars: ${twilioMissing.join(', ')}. Twilio IVR will not work.`);
    } else {
      this.logger.log(`Twilio IVR ready — phone=${twilioPhone}`);
    }

    // Check ngrok URL
    const publicUrl = this.config.get<string>('PUBLIC_URL', '');
    if (!publicUrl) {
      this.logger.warn('PUBLIC_URL not set. Twilio webhooks will not work. Run: ngrok http 3000');
    } else {
      this.logger.log(`Public URL configured: ${publicUrl}`);
    }
  }
}
