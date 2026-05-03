import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum SleepType {
  DAY_NAP     = 'day_nap',
  NIGHT_SLEEP = 'night_sleep',
}

@Entity('sleep_logs')
export class SleepLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) neonatalPatientId: string;

  @Column({ type: 'enum', enum: SleepType })
  sleepType: SleepType;

  @Column({ type: 'timestamptz' }) startTime: Date;
  @Column({ type: 'timestamptz' }) endTime: Date;

  @CreateDateColumn() createdAt: Date;
}
