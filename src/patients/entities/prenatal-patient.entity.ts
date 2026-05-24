import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NeonatalPatient } from './neonatal-patient.entity';

@Entity('prenatal_patients')
export class PrenatalPatient {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) fullName: string;
  @Column({ type: 'varchar' }) phone: string;
  @Column({ type: 'varchar', nullable: true }) email: string | null;
  @Column({ type: 'varchar', nullable: true }) age: string | null;
  @Column({ type: 'varchar', nullable: true }) nationality: string | null;
  @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'varchar', nullable: true }) village: string | null;
  @Column({ type: 'varchar', nullable: true, name: 'healthCentre' }) facilityName: string | null;
  @Column({ type: 'varchar', nullable: true }) lmpDate: string | null;
  @Column({ type: 'varchar', nullable: true }) pregnancyMonths: string | null;
  @Column({ type: 'varchar', nullable: true }) pregnancyWeeks: string | null;
  @Column({ type: 'varchar', nullable: true }) expectedDeliveryDate: string | null;

  @Column({ type: 'int', nullable: true }) gravida: number | null;
  @Column({ type: 'int', nullable: true }) parity: number | null;
  @Column({ type: 'jsonb', nullable: true }) existingConditions: string[] | null;
  @Column({ type: 'varchar', nullable: true }) emergencyContact: string | null;

  @Column({ type: 'varchar', nullable: true }) registeredById: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registeredById' })
  registeredBy: User | null;

  @Column({ type: 'varchar', nullable: true }) userId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  // Maternal Health Tracking
  @Column({ type: 'varchar', nullable: true, default: 'active' }) patientStatus: string | null; // 'active', 'delivered', 'lost-to-followup', 'transferred'
  @Column({ type: 'date', nullable: true }) deliveryDate: Date | null;
  @Column({ type: 'varchar', nullable: true }) deliveryOutcome: string | null; // 'live-birth', 'stillbirth', 'miscarriage'
  @Column({ type: 'varchar', nullable: true }) deliveryMethod: string | null; // 'vaginal', 'cesarean', 'assisted'
  @Column({ type: 'varchar', nullable: true }) placeOfDelivery: string | null; // 'health-facility', 'home', 'other'

  // Maternal Complications
  @Column({ type: 'jsonb', nullable: true }) antenatalComplications: string[] | null; // e.g., ['gestational-diabetes', 'preeclampsia', 'anemia']
  @Column({ type: 'jsonb', nullable: true }) deliveryComplications: string[] | null; // e.g., ['hemorrhage', 'infection', 'prolonged-labor']
  @Column({ type: 'varchar', nullable: true }) currentMaternalStatus: string | null; // 'healthy', 'at-risk', 'critical'

  // ANC Compliance
  @Column({ type: 'int', nullable: true }) ancVisitsCompleted: number | null;
  @Column({ type: 'int', nullable: true }) ancVisitsScheduled: number | null;
  @Column({ type: 'boolean', default: false }) isANCCompliant: boolean;
  @Column({ type: 'date', nullable: true }) lastANCVisitDate: Date | null;

  // Postpartum Tracking
  @Column({ type: 'date', nullable: true }) postpartumFollowUpDate: Date | null;
  @Column({ type: 'boolean', default: false }) postpartumFollowUpCompleted: boolean;
  @Column({ type: 'text', nullable: true }) postpartumNotes: string | null;

  // Neonatal Records
  @OneToMany(() => NeonatalPatient, (neonatal) => neonatal.prenatalPatient, {
    cascade: true,
  })
  neonatalRecords: NeonatalPatient[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
