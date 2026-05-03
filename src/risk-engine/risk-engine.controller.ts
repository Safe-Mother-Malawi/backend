import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';
import { AssessRiskDto } from './dto/assess-risk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('risk-engine')
export class RiskEngineController {
  constructor(private readonly riskEngineService: RiskEngineService) {}

  /**
   * POST /risk-engine/assess
   * Run the full layered risk assessment (weighted scoring + safety overrides + care pathway).
   * Used by both mobile app (self-assessment) and clinician portal (manual entry).
   */
  @Post('assess')
  assess(@Body() dto: AssessRiskDto) {
    return this.riskEngineService.assess(dto);
  }
}
