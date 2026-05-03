import {
  IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, Max,
} from 'class-validator';
import { PatientType } from '../entities/risk-assessment.entity';

export class CreateRiskAssessmentDto {
  @IsNotEmpty() @IsString() patientId: string;
  @IsNotEmpty() @IsString() patientName: string;
  @IsNotEmpty() @IsString() patientPhone: string;

  @IsEnum(PatientType)
  patientType: PatientType;

  @IsInt() @Min(0) @Max(100)
  score: number;

  @IsNotEmpty() @IsString() message: string;

  @IsOptional() @IsObject()
  answers?: Record<string, unknown>;
}
