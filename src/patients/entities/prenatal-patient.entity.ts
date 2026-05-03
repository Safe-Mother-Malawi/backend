import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('prenatal_patients')
export class PrenatalPatient {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) fullName: string;
  @Column({ type: 'varchar' }) phone: string;
  @Column({ type: 'varchar', nullable: true }) email: string | null;
  @Column({ type: 'varchar', nullable: true }) age: string | null;
  @Column({ type: 'varchar', nullable: true }) nationality: string | null;
  @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'varchar', nullable: true, name: 'healthCentre' }) facilityName: string | null;
  @Column({ type: 'varchar', nullable: true }) lmpDate: string | null;
  @Column({ type: 'varchar', nullable: true }) pregnancyMonths: string | null;
  @Column({ type: 'varchar', nullable: true }) pregnancyWeeks: string | null;
  @Column({ type: 'varchar', nullable: true }) expectedDeliveryDate: string | null;

  @Column({ type: 'varchar', nullable: true }) registeredById: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registeredById' })
  registeredBy: User | null;

  @Column({ type: 'varchar', nullable: true }) userId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
