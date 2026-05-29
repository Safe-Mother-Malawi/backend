import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { HealthFacility } from '../../health-facilities/entities/health-facility.entity';
import { PrenatalPatient } from '../../patients/entities/prenatal-patient.entity';
import { NeonatalPatient } from '../../patients/entities/neonatal-patient.entity';
import { RiskAssessment, RiskLevel } from '../../risk-assessments/entities/risk-assessment.entity';
import { Appointment, AppointmentType, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { Alert, AlertSeverity } from '../../alerts/entities/alert.entity';

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
        facilityId: facilities[0].id,
        isActive: true,
      },
      {
        email: 'clinician2@example.com',
        fullName: 'Dr. James Mwale',
        role: UserRole.CLINICIAN,
        facilityId: facilities[1].id,
        isActive: true,
      },
      {
        email: 'clinician3@example.com',
        fullName: 'Nurse Mary Phiri',
        role: UserRole.CLINICIAN,
        facilityId: facilities[2].id,
        isActive: true,
      },
      {
        email: 'clinician4@example.com',
        fullName: 'Dr. Peter Nkomo',
        role: UserRole.CLINICIAN,
        facilityId: facilities[3].id,
        isActive: true,
      },
    ] as any);

    // 3. Create Prenatal Patients (1420 total across districts)
    const prenatalPatients: PrenatalPatient[] = [];
    const districts = ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba'];
    const riskLevels = [RiskLevel.LOW, RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.CRITICAL];
    const firstNames = ['Sarah', 'Mary', 'Jane', 'Grace', 'Rose', 'Lucy', 'Alice', 'Betty', 'Carol', 'Diana'];
    const lastNames = ['Banda', 'Mwale', 'Phiri', 'Nkomo', 'Chikwanda', 'Mbewe', 'Kamwendo', 'Nyirenda', 'Gondwe', 'Mwanza'];

    for (let i = 0; i < 1420; i++) {
      const district = districts[i % districts.length];
      const facility = facilities.find(f => f.district === district);
      const clinician = clinicians[i % clinicians.length];
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];

      prenatalPatients.push({
        fullName: `${firstName} ${lastName}`,
        age: 18 + (i % 30),
        phone: `+265${Math.floor(Math.random() * 900000000) + 100000000}`,
        district,
        facility,
        clinician,
        gestationalAge: 8 + (i % 32),
        patientStatus: i % 15 === 0 ? 'delivered' : 'active',
        deliveryOutcome: i % 15 === 0 ? (i % 2 === 0 ? 'live-birth' : 'stillbirth') : null,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(PrenatalPatient, prenatalPatients);

    // 4. Create Neonatal Patients (850 total)
    const neonatalPatients: NeonatalPatient[] = [];
    for (let i = 0; i < 850; i++) {
      const district = districts[i % districts.length];
      const facility = facilities.find(f => f.district === district);
      const clinician = clinicians[i % clinicians.length];
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];

      neonatalPatients.push({
        fullName: `Baby ${firstName} ${lastName}`,
        dateOfBirth: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        weight: 2.5 + Math.random() * 1.5,
        district,
        facility,
        clinician,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(NeonatalPatient, neonatalPatients);

    // 5. Create Risk Assessments (350 high-risk, 650 moderate, 1420 low)
    const riskAssessments: RiskAssessment[] = [];
    const allPatients = [...prenatalPatients];

    // High risk (350)
    for (let i = 0; i < 350; i++) {
      riskAssessments.push({
        patient: allPatients[i % allPatients.length],
        riskLevel: RiskLevel.HIGH,
        factors: ['Hypertension', 'Diabetes', 'Previous complications'],
        assessmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }

    // Moderate risk (650)
    for (let i = 350; i < 1000; i++) {
      riskAssessments.push({
        patient: allPatients[i % allPatients.length],
        riskLevel: RiskLevel.MODERATE,
        factors: ['Age > 35', 'First pregnancy'],
        assessmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }

    // Low risk (1420)
    for (let i = 1000; i < 2420; i++) {
      riskAssessments.push({
        patient: allPatients[i % allPatients.length],
        riskLevel: RiskLevel.LOW,
        factors: [],
        assessmentDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(RiskAssessment, riskAssessments);

    // 6. Create Appointments (2500 total, 2150 completed, 350 missed)
    const appointments: Appointment[] = [];
    for (let i = 0; i < 2500; i++) {
      const isCompleted = i < 2150;
      appointments.push({
        patient: allPatients[i % allPatients.length],
        type: AppointmentType.ANC,
        status: isCompleted ? AppointmentStatus.COMPLETED : AppointmentStatus.NO_SHOW,
        scheduledFor: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      } as any);
    }
    await queryRunner.manager.save(Appointment, appointments);

    // 7. Create Alerts (150 active alerts for high-risk cases)
    const alerts: Alert[] = [];
    for (let i = 0; i < 150; i++) {
      alerts.push({
        patientName: allPatients[i % allPatients.length].fullName,
        patientStatus: 'high-risk',
        contact: allPatients[i % allPatients.length].phone || '+265999999999',
        reason: 'High-risk pregnancy requiring immediate attention',
        severity: AlertSeverity.HIGH,
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
