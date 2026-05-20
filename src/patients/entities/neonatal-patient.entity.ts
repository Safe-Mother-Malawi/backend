import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('neonatal_patients')
export class NeonatalPatient {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) babyName: string;
  @Column({ type: 'varchar' }) babyDob: string;
  @Column({ type: 'varchar', nullable: true }) babyGender: string | null;
  @Column({ type: 'varchar', nullable: true }) babyBirthWeight: string | null;

  @Column({ type: 'varchar' }) motherName: string;
  @Column({ type: 'varchar' }) motherPhone: string;
  @Column({ type: 'varchar', nullable: true }) motherEmail: string | null;
  @Column({ type: 'varchar', nullable: true }) motherAge: string | null;
  @Column({ type: 'varchar', nullable: true }) nationality: string | null;
  @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'varchar', nullable: true }) village: string | null;
  @Column({ type: 'varchar', nullable: true, name: 'healthCentre' }) facilityName: string | null;
  @Column({ type: 'varchar', nullable: true }) emergencyContact: string | null;

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
