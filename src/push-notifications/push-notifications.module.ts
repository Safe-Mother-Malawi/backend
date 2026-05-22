import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushNotificationsService } from './push-notifications.service';
import { BroadcastService } from './services/broadcast.service';
import { PushNotificationsController } from './push-notifications.controller';
import { DeviceToken } from './entities/device-token.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceToken, User]),
    NotificationsModule,
    FirebaseModule,
  ],
  providers: [PushNotificationsService, BroadcastService],
  controllers: [PushNotificationsController],
  exports: [PushNotificationsService, BroadcastService],
})
export class PushNotificationsModule {}
