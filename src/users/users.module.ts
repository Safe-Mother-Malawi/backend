import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersProfileController } from './users-profile.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersSeedService } from './seed/users.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ActivityLogModule, NotificationsModule],
  providers: [UsersService, UsersSeedService],
  controllers: [UsersController, UsersProfileController],
  exports: [UsersService, UsersSeedService],
})
export class UsersModule {}
