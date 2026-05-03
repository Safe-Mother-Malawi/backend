import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedingLog } from './entities/feeding-log.entity';
import { SleepLog } from './entities/sleep-log.entity';
import { Vaccine } from './entities/vaccine.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeedingLog, SleepLog, Vaccine])],
  providers: [TrackingService],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}
