import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { HealthCheckType, HealthCheckRiskLevel } from '../entities/health-check-history.entity';

export class CreateHealthCheckHistoryDto {
  @IsEnum(HealthCheckType)
  type: HealthCheckType;

  @IsEnum(HealthCheckRiskLevel)
  riskLevel: HealthCheckRiskLevel;

  @IsNumber()
  @Min(0)
  score: number;

  @IsNumber()
  @Min(0.01)
  maxScore: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  symptoms?: string[] | null;

  @IsOptional()
  @IsObject()
  answers?: Record<string, unknown> | null;
}
