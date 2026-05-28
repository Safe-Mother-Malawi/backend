import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from './entities/referral.entity';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { HealthFacilitiesModule } from '../health-facilities/health-facilities.module';
import { EventsModule } from '../events/events.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral]),
    NotificationsModule,
    HealthFacilitiesModule,
    EventsModule,
    ActivityLogModule,
  ],
  providers: [ReferralsService],
  controllers: [ReferralsController],
  exports: [ReferralsService],
})
export class ReferralsModule {}
