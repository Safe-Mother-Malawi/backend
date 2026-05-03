import { IsBoolean, IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';

export class AssessRiskDto {
  @IsEnum(['prenatal', 'neonatal'])
  patientType: 'prenatal' | 'neonatal';

  // Prenatal weighted inputs
  @IsOptional() @IsInt() @Min(0) @Max(10) generalWellbeing?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) headache?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) swelling?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) fetalMovement?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) bleedingDischarge?: number;

  // Clinical readings (safety layer)
  @IsOptional() @IsInt() @Min(0) @Max(300) systolicBP?: number;
  @IsOptional() @IsInt() @Min(0) @Max(200) diastolicBP?: number;
  @IsOptional() @IsBoolean() hasHeavyBleeding?: boolean;
  @IsOptional() @IsBoolean() hasSevereHeadacheWithVision?: boolean;
  @IsOptional() @IsBoolean() hasSuddenSevereSwelling?: boolean;
  @IsOptional() @IsBoolean() hasNoFetalMovement?: boolean;

  // Neonatal weighted inputs
  @IsOptional() @IsInt() @Min(0) @Max(10) breathing?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) feeding?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) skinColor?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) temperature?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) activity?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) umbilicalCord?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10) wetNappies?: number;

  // Neonatal clinical overrides
  @IsOptional() @IsBoolean() hasNoBreathing?: boolean;
  @IsOptional() @IsBoolean() hasSeizures?: boolean;
  @IsOptional() @IsBoolean() hasBlueSkin?: boolean;
  @IsOptional() @IsInt() @Min(0) babyAgeInDays?: number;
}
