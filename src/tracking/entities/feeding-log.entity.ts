import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export enum FeedType {
  BREAST  = 'breast',
  FORMULA = 'formula',
  MIXED   = 'mixed',
}

@Entity('feeding_logs')
export class FeedingLog {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) neonatalPatientId: string;

  @Column({ type: 'enum', enum: FeedType })
  feedType: FeedType;

  @Column({ type: 'int', nullable: true }) volumeMl: number | null;
  @Column({ type: 'int', nullable: true }) durationMin: number | null;

  @Column({ type: 'timestamptz' }) feedTime: Date;

  @CreateDateColumn() createdAt: Date;
}
