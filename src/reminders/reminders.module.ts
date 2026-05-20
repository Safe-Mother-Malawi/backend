import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersService } from './reminders.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { PrenatalPatient } from '../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../patients/entities/neonatal-patient.entity';
import { Vaccine } from '../tracking/entities/vaccine.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, PrenatalPatient, NeonatalPatient, Vaccine]),
    NotificationsModule,
  ],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
