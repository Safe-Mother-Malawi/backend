import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportFormat, ReportType } from '../entities/report.entity';

export class GenerateReportDto {
  @IsEnum(ReportType) type: ReportType;
  @IsEnum(ReportFormat) format: ReportFormat;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() dateFrom?: string;
  @IsOptional() @IsString() dateTo?: string;
}
