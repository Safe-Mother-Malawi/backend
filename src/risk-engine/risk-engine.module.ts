import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk-engine.service';
import { RiskEngineController } from './risk-engine.controller';

@Module({
  providers: [RiskEngineService],
  controllers: [RiskEngineController],
  exports: [RiskEngineService],
})
export class RiskEngineModule {}
