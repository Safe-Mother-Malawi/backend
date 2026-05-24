import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateNeonatalTables1735000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create neonatal_patients table
    await queryRunner.createTable(
      new Table({
        name: 'neonatal_patients',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'prenatal_patient_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'baby_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'baby_gender',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'date_of_birth',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'birth_weight',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'birth_length',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'head_circumference',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'delivery_mode',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'delivery_place',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'delivery_complications',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'apgar_score_1min',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'apgar_score_5min',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'birth_defects_screened',
            type: 'boolean',
            default: false,
          },
          {
            name: 'birth_defects_findings',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hearing_screened',
            type: 'boolean',
            default: false,
          },
          {
            name: 'hearing_screening_results',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metabolic_screened',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metabolic_screening_results',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'feeding_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'breastfeeding_initiated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'breastfeeding_initiated_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'feeding_challenges',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'immunizations_given',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'current_health_status',
            type: 'varchar',
            length: '50',
            default: "'Healthy'",
          },
          {
            name: 'health_concerns',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'jaundice_present',
            type: 'boolean',
            default: false,
          },
          {
            name: 'jaundice_level',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'umbilical_cord_infection',
            type: 'boolean',
            default: false,
          },
          {
            name: 'skin_infection',
            type: 'boolean',
            default: false,
          },
          {
            name: 'other_health_issues',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'follow_up_status',
            type: 'varchar',
            length: '50',
            default: "'Pending'",
          },
          {
            name: 'next_follow_up_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'follow_up_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'risk_flag_raised',
            type: 'boolean',
            default: false,
          },
          {
            name: 'risk_assessment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'risk_level',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'clinician_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'clinician_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'health_facility',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create neonatal_visits table
    await queryRunner.createTable(
      new Table({
        name: 'neonatal_visits',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'neonatal_patient_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'visit_number',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'scheduled_date',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'completed_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'scheduled'",
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'length',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'head_circumference',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'temperature',
            type: 'decimal',
            precision: 5,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'heart_rate',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'respiratory_rate',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'general_appearance',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'skin_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'umbilical_cord_status',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'eye_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ear_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mouth_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'chest_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'abdominal_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'genitals_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'extremities_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'neurological_examination',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'jaundice_present',
            type: 'boolean',
            default: false,
          },
          {
            name: 'jaundice_level',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'bilirubin_level',
            type: 'decimal',
            precision: 5,
            scale: 1,
            isNullable: true,
          },
          {
            name: 'feeding_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'feeding_well_established',
            type: 'boolean',
            default: false,
          },
          {
            name: 'feeding_challenges',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'feeding_recommendations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'immunizations_given',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'immunization_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'developmental_milestones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'developmental_concerns',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'hearing_screened',
            type: 'boolean',
            default: false,
          },
          {
            name: 'hearing_screening_results',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metabolic_screened',
            type: 'boolean',
            default: false,
          },
          {
            name: 'metabolic_screening_results',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'birth_defects_screened',
            type: 'boolean',
            default: false,
          },
          {
            name: 'birth_defects_screening_results',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'counseling_topics',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'counseling_notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'risk_flag_raised',
            type: 'boolean',
            default: false,
          },
          {
            name: 'risk_level',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'risk_assessment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'risk_management_plan',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'referral_required',
            type: 'boolean',
            default: false,
          },
          {
            name: 'referral_facility',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'referral_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'next_visit_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'follow_up_plan',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'clinician_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'clinician_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'health_facility',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for neonatal_patients
    await queryRunner.createForeignKey(
      'neonatal_patients',
      new TableForeignKey({
        columnNames: ['prenatal_patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'prenatal_patients',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for neonatal_visits
    await queryRunner.createForeignKey(
      'neonatal_visits',
      new TableForeignKey({
        columnNames: ['neonatal_patient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'neonatal_patients',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'neonatal_patients',
      new TableIndex({
        columnNames: ['prenatal_patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'neonatal_visits',
      new TableIndex({
        columnNames: ['neonatal_patient_id'],
      }),
    );

    await queryRunner.createIndex(
      'neonatal_visits',
      new TableIndex({
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'neonatal_visits',
      new TableIndex({
        columnNames: ['scheduled_date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('neonatal_visits', true);
    await queryRunner.dropTable('neonatal_patients', true);
  }
}
