import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, PrenatalPatient, NeonatalPatient]),
    NotificationsModule,
    UsersModule,
  ],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
