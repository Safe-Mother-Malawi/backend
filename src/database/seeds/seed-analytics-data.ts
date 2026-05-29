import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { HealthFacility } from '../../health-facilities/entities/health-facility.entity';
import { PrenatalPatient } from '../../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../../patients/entities/neonatal-patient.entity';
import { RiskAssessment, RiskLevel } from '../../risk-assessments/entities/risk-assessment.entity';
import { Appointment, AppointmentType, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { Alert, AlertType, AlertSeverity } from '../../alerts/entities/alert.entity';

/**
 * Seed data for analytics dashboards
 * Creates realistic sample data so graphs display clearly
 * New data will be added on top of this seed data
 */
export async function seedAnalyticsData(dataSource: DataSource) {
  console.log('🌱 Seeding analytics data...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if data already exists
    const existingFacilities = await queryRunner.manager.count(HealthFacility);
    if (existingFacilities > 0) {
      console.log('✅ Analytics data already seeded, skipping...');
      await queryRunner.release();
      return;
    }

    // 1. Create Health Facilities
    const facilities = await queryRunner.manager.save(HealthFacility, [
      { facilityName: 'Lilongwe Central Hospital', district: 'Lilongwe', type: 'Hospital' },
      { facilityName: 'Blantyre District Hospital', district: 'Blantyre', type: 'Hospital' },
      { facilityName: 'Mzuzu Central Hospital', district: 'Mzuzu', type: 'Hospital' },
      { facilityName: 'Zomba District Hospital', district: 'Zomba', type: 'Hospital' },
      { facilityName: 'Lilongwe Health Center', district: 'Lilongwe', type: 'Health Center' },
      { facilityName: 'Blantyre Health Center', district: 'Blantyre', type: 'Health Center' },
    ]);

    // 2. Create Clinicians
    const clinicians = await queryRunner.manager.save(User, [
      {
        email: 'clinician1@example.com',
        fullName: 'Dr. Sarah Banda',
        role: UserRole.CLINICIAN,
        facility: facilities[0],
        isActive: true,
      },
      {
        email: 'clinician2@example.com',
        fullName: 'Dr. James Mwale',
        role: UserRole.CLINICIAN,
        facility: facilities[1],
        isActive: true,
      },
      {
        email: 'clinician3@example.com',
        fullName: 'Nurse Mary Phiri',
        role: UserRole.CLINICIAN,
        facility: facilities[2],
        isActive: true,
      },
      {
        email: 'clinician4@example.com',
        fullName: 'Dr. Peter Nkomo',
        role: UserRole.CLINICIAN,
        facility: facilities[3],
        isActive: true,
      },
    ]);

    // 3. Create Prenatal Patients (450 total across districts)
    const prenatalPatients: PrenatalPatient[] = [];
    const districts = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'];
    const riskLevels = [RiskLevel.LOW, RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.CRITICAL];

    for (let i = 0; i < 450; i++) {
      const district = districts[i % districts.length];
      const facility = facilities.find(f => f.district === district);
      const clinician = clinicians[i % clinicians.length];

      prenatalPatients.push({
        fullName: `Patient ${i + 1}`,
        age: 18 + (i % 30),
        phoneNumber: `+265${Math.random().toString().slice(2, 11)}`,
        district,
        facility,
        clinician,
        gestationalAge: 8 + (i % 32),
        patientStatus: i % 10 === 0 ? 'delivered' : 'active',
        deliveryOutcome: i % 10 === 0 ? (i % 2 === 0 ? 'live-birth' : 'stillbirth') : null,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(PrenatalPatient, prenatalPatients);

    // 4. Create Neonatal Patients (380 total)
    const neonatalPatients: NeonatalPatient[] = [];
    for (let i = 0; i < 380; i++) {
      const district = districts[i % districts.length];
      const facility = facilities.find(f => f.district === district);
      const clinician = clinicians[i % clinicians.length];

      neonatalPatients.push({
        fullName: `Neonate ${i + 1}`,
        dateOfBirth: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        weight: 2.5 + Math.random() * 1.5,
        district,
        facility,
        clinician,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(NeonatalPatient, neonatalPatients);

    // 5. Create Risk Assessments (156 high-risk, 342 moderate, 922 low)
    const riskAssessments: RiskAssessment[] = [];
    const allPatients = [...prenatalPatients];

    // High risk (156)
    for (let i = 0; i < 156; i++) {
      riskAssessments.push({
        patient: allPatients[i],
        riskLevel: RiskLevel.HIGH,
        factors: ['Hypertension', 'Diabetes', 'Previous complications'],
        assessmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }

    // Moderate risk (342)
    for (let i = 156; i < 498; i++) {
      riskAssessments.push({
        patient: allPatients[i % allPatients.length],
        riskLevel: RiskLevel.MODERATE,
        factors: ['Age > 35', 'First pregnancy'],
        assessmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }

    // Low risk (922)
    for (let i = 498; i < 1420; i++) {
      riskAssessments.push({
        patient: allPatients[i % allPatients.length],
        riskLevel: RiskLevel.LOW,
        factors: [],
        assessmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(RiskAssessment, riskAssessments);

    // 6. Create Appointments (1250 total, 1087 completed, 163 missed)
    const appointments: Appointment[] = [];
    for (let i = 0; i < 1250; i++) {
      const isCompleted = i < 1087;
      appointments.push({
        patient: allPatients[i % allPatients.length],
        type: AppointmentType.ANC,
        status: isCompleted ? AppointmentStatus.COMPLETED : AppointmentStatus.NO_SHOW,
        scheduledFor: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(Appointment, appointments);

    // 7. Create Alerts (active alerts for high-risk cases)
    const alerts: Alert[] = [];
    for (let i = 0; i < 50; i++) {
      alerts.push({
        patient: allPatients[i],
        type: AlertType.HIGH_RISK,
        severity: AlertSeverity.HIGH,
        message: `High-risk pregnancy requiring immediate attention`,
        attended: false,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(Alert, alerts);

    await queryRunner.commitTransaction();
    console.log('✅ Analytics data seeded successfully!');
    console.log(`   - ${facilities.length} health facilities`);
    console.log(`   - ${clinicians.length} clinicians`);
    console.log(`   - ${prenatalPatients.length} prenatal patients`);
    console.log(`   - ${neonatalPatients.length} neonatal patients`);
    console.log(`   - ${riskAssessments.length} risk assessments`);
    console.log(`   - ${appointments.length} appointments`);
    console.log(`   - ${alerts.length} alerts`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding analytics data:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
