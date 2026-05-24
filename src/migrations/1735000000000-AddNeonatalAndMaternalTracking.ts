import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNeonatalAndMaternalTracking1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add neonatal patient tracking columns
    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'patientStatus',
        type: 'varchar',
        isNullable: true,
        default: "'alive'",
        comment: "Status: 'alive', 'deceased', 'transferred'",
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'causeOfDeath',
        type: 'varchar',
        isNullable: true,
        comment: 'Cause of death if deceased',
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'dateOfDeath',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'deathNotes',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'vaccinesGiven',
        type: 'jsonb',
        isNullable: true,
        comment: 'Array of vaccine names given',
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'lastVaccinationDate',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'healthComplications',
        type: 'jsonb',
        isNullable: true,
        comment: 'Array of health complications',
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'currentHealthStatus',
        type: 'varchar',
        isNullable: true,
        comment: "Status: 'healthy', 'at-risk', 'critical'",
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'nextFollowUpDate',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'followUpCompleted',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'neonatal_patients',
      new TableColumn({
        name: 'followUpNotes',
        type: 'text',
        isNullable: true,
      }),
    );

    // Add prenatal patient tracking columns
    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'patientStatus',
        type: 'varchar',
        isNullable: true,
        default: "'active'",
        comment: "Status: 'active', 'delivered', 'lost-to-followup', 'transferred'",
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'deliveryDate',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'deliveryOutcome',
        type: 'varchar',
        isNullable: true,
        comment: "Outcome: 'live-birth', 'stillbirth', 'miscarriage'",
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'deliveryMethod',
        type: 'varchar',
        isNullable: true,
        comment: "Method: 'vaginal', 'cesarean', 'assisted'",
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'placeOfDelivery',
        type: 'varchar',
        isNullable: true,
        comment: "Place: 'health-facility', 'home', 'other'",
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'antenatalComplications',
        type: 'jsonb',
        isNullable: true,
        comment: 'Array of antenatal complications',
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'deliveryComplications',
        type: 'jsonb',
        isNullable: true,
        comment: 'Array of delivery complications',
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'currentMaternalStatus',
        type: 'varchar',
        isNullable: true,
        comment: "Status: 'healthy', 'at-risk', 'critical'",
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'ancVisitsCompleted',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'ancVisitsScheduled',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'isANCCompliant',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'lastANCVisitDate',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'postpartumFollowUpDate',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'postpartumFollowUpCompleted',
        type: 'boolean',
        default: false,
      }),
    );

    await queryRunner.addColumn(
      'prenatal_patients',
      new TableColumn({
        name: 'postpartumNotes',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop neonatal columns
    await queryRunner.dropColumn('neonatal_patients', 'patientStatus');
    await queryRunner.dropColumn('neonatal_patients', 'causeOfDeath');
    await queryRunner.dropColumn('neonatal_patients', 'dateOfDeath');
    await queryRunner.dropColumn('neonatal_patients', 'deathNotes');
    await queryRunner.dropColumn('neonatal_patients', 'vaccinesGiven');
    await queryRunner.dropColumn('neonatal_patients', 'lastVaccinationDate');
    await queryRunner.dropColumn('neonatal_patients', 'healthComplications');
    await queryRunner.dropColumn('neonatal_patients', 'currentHealthStatus');
    await queryRunner.dropColumn('neonatal_patients', 'nextFollowUpDate');
    await queryRunner.dropColumn('neonatal_patients', 'followUpCompleted');
    await queryRunner.dropColumn('neonatal_patients', 'followUpNotes');

    // Drop prenatal columns
    await queryRunner.dropColumn('prenatal_patients', 'patientStatus');
    await queryRunner.dropColumn('prenatal_patients', 'deliveryDate');
    await queryRunner.dropColumn('prenatal_patients', 'deliveryOutcome');
    await queryRunner.dropColumn('prenatal_patients', 'deliveryMethod');
    await queryRunner.dropColumn('prenatal_patients', 'placeOfDelivery');
    await queryRunner.dropColumn('prenatal_patients', 'antenatalComplications');
    await queryRunner.dropColumn('prenatal_patients', 'deliveryComplications');
    await queryRunner.dropColumn('prenatal_patients', 'currentMaternalStatus');
    await queryRunner.dropColumn('prenatal_patients', 'ancVisitsCompleted');
    await queryRunner.dropColumn('prenatal_patients', 'ancVisitsScheduled');
    await queryRunner.dropColumn('prenatal_patients', 'isANCCompliant');
    await queryRunner.dropColumn('prenatal_patients', 'lastANCVisitDate');
    await queryRunner.dropColumn('prenatal_patients', 'postpartumFollowUpDate');
    await queryRunner.dropColumn('prenatal_patients', 'postpartumFollowUpCompleted');
    await queryRunner.dropColumn('prenatal_patients', 'postpartumNotes');
  }
}
