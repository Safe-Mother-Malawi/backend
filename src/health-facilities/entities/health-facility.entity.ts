import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('health_facilities')
export class HealthFacility {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ type: 'varchar' }) region: string;
  @Column({ type: 'varchar' }) zone: string;

  @Column({ type: 'varchar' })
  @Index()
  district: string;

  @Column({ type: 'varchar' })
  @Index()
  facilityName: string;

  @Column({ type: 'varchar' }) facilityType: string;
  @Column({ type: 'varchar' }) managingAuthority: string;
  @Column({ type: 'varchar' }) urbanRural: string;

  @OneToMany(() => User, user => user.assignedFacility)
  clinicians: User[];
}
