import {
  Controller, Get, Post, Body, UseGuards,
} from '@nestjs/common';
import { WhoQuestionsService } from './who-questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { IsArray, IsInt, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsInt() questionId: number;
  @IsIn([0, 1]) value: 0 | 1;
}

class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

@UseGuards(JwtAuthGuard)
@Controller('who')
export class WhoQuestionsController {
  constructor(private readonly service: WhoQuestionsService) {}

  /**
   * GET /who/questions
   * Auto-detects stage from the logged-in user's profile data.
   * Prenatal: uses lmpDate or pregnancyMonths/pregnancyWeeks
   * Neonatal: uses babyDob
   */
  @Get('questions')
  async getQuestions(@CurrentUser() user: User) {
    const stage = this._detectStage(user);
    const questions = await this.service.getByStage(stage);
    return {
      stage,
      category: user.role === UserRole.PRENATAL ? 'prenatal' : 'neonatal',
      questions: questions.map(q => ({
        id:           q.id,
        questionText: q.questionText,
        severityTag:  q.severityTag,
        weight:       q.weight,
      })),
    };
  }

  /**
   * POST /who/assessment
   * Submit YES/NO answers, get score + risk level back.
   * Now includes rule-based critical symptom override logic.
   */
  @Post('assessment')
  async submitAssessment(
    @Body() dto: SubmitAssessmentDto,
    @CurrentUser() user: User,
  ) {
    const stage = this._detectStage(user);
    const result = await this.service.computeScore(stage, dto.answers);

    // Map WHO percentage-based risk to the existing risk level labels
    const riskLevelLabel = result.riskLevel === 'HIGH'
      ? (user.role === UserRole.NEONATAL ? 'Seek Help Immediately' : 'High Risk')
      : result.riskLevel === 'MEDIUM'
        ? 'Moderate Risk'
        : 'Low Risk';

    // Enhanced message with critical symptom information
    let message = result.riskLevel === 'HIGH'
      ? 'URGENT: Your symptoms require immediate medical attention. Go to the nearest hospital now or call 116.'
      : result.riskLevel === 'MEDIUM'
        ? 'Some symptoms require monitoring. Please contact your clinician within 24–48 hours.'
        : 'You appear to be in good health. Continue your regular care visits and maintain a healthy lifestyle.';

    // Add critical symptom override information to message
    if (result.riskOverride) {
      message = `🚨 CRITICAL ALERT: ${result.riskOverride}\n\n${message}`;
    }

    return {
      stage,
      score:        result.score,
      maxScore:     result.maxScore,
      percentage:   result.percentage,
      riskLevel:    riskLevelLabel,
      message,
      answeredQuestions: result.answeredQuestions,
      // New fields for rule-based logic
      criticalSymptoms: result.criticalSymptoms,
      riskOverride: result.riskOverride,
      algorithmScore: result.percentage, // Original algorithm score for transparency
    };
  }

  private _detectStage(user: User): string {
    if (user.role === UserRole.PRENATAL) {
      // Use lmpDate if available, otherwise derive from pregnancyMonths/Weeks
      if (user.lmpDate) {
        return WhoQuestionsService.derivePrenatalStage(user.lmpDate);
      }
      const months = parseInt(user.pregnancyMonths ?? '0', 10);
      const weeks  = parseInt(user.pregnancyWeeks  ?? '0', 10);
      const totalWeeks = (months * 4) + weeks;
      if (totalWeeks <= 12) return 'trimester_1';
      if (totalWeeks <= 27) return 'trimester_2';
      return 'trimester_3';
    }
    // Neonatal
    if (user.babyDob) {
      return WhoQuestionsService.deriveNeonatalStage(user.babyDob);
    }
    return 'early_neonatal'; // safe default
  }
}
