import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), ActivityLogModule],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
