import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhoQuestion } from './entities/who-question.entity';
import { WHO_QUESTIONS_SEED } from './seed/who-questions.seed';

@Injectable()
export class WhoQuestionsService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(WhoQuestion)
    private readonly repo: Repository<WhoQuestion>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(WHO_QUESTIONS_SEED.map(q => this.repo.create(q)));
    }
  }

  /** Return questions for a specific stage */
  async getByStage(stage: string): Promise<WhoQuestion[]> {
    return this.repo.find({ where: { stage, isActive: true }, order: { id: 'ASC' } });
  }

  /** Derive prenatal stage from LMP date string (YYYY-MM-DD) */
  static derivePrenatalStage(lmpDate: string): string {
    const lmp = new Date(lmpDate);
    const weeksPregnant = Math.floor(
      (Date.now() - lmp.getTime()) / (1000 * 60 * 60 * 24 * 7),
    );
    if (weeksPregnant <= 12) return 'trimester_1';
    if (weeksPregnant <= 27) return 'trimester_2';
    return 'trimester_3';
  }

  /** Derive neonatal stage from baby DOB string (YYYY-MM-DD or ISO) */
  static deriveNeonatalStage(babyDob: string): string {
    const dob = new Date(babyDob);
    const ageInDays = Math.floor(
      (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24),
    );
    return ageInDays <= 7 ? 'early_neonatal' : 'late_neonatal';
  }

  /** Compute WHO score from YES/NO answers with rule-based critical symptom override */
  async computeScore(
    stage: string,
    answers: { questionId: number; value: 0 | 1 }[],
  ): Promise<{
    score: number;
    maxScore: number;
    percentage: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    answeredQuestions: { question: string; answer: string; weight: number; contributed: number }[];
    criticalSymptoms?: string[]; // New: List of critical symptoms detected
    mediumRiskSymptoms?: string[]; // New: List of medium-risk symptoms detected
    riskOverride?: string; // New: Reason for risk override
  }> {
    const questions = await this.getByStage(stage);
    const qMap = new Map(questions.map(q => [q.id, q]));

    let score = 0;
    const maxScore = questions.reduce((s, q) => s + q.weight, 0);
    const answeredQuestions: { question: string; answer: string; weight: number; contributed: number }[] = [];
    const criticalSymptoms: string[] = [];
    const mediumRiskSymptoms: string[] = [];

    for (const ans of answers) {
      const q = qMap.get(ans.questionId);
      if (!q) continue;
      const contributed = ans.value === 1 ? q.weight : 0;
      score += contributed;
      answeredQuestions.push({
        question:    q.questionText,
        answer:      ans.value === 1 ? 'YES' : 'NO',
        weight:      q.weight,
        contributed,
      });

      // 🚨 RULE-BASED LOGIC: Check for critical and medium-risk symptoms
      if (ans.value === 1) {
        if (q.severityTag === 'HIGH') {
          criticalSymptoms.push(q.questionText);
        } else if (q.severityTag === 'MEDIUM') {
          mediumRiskSymptoms.push(q.questionText);
        }
      }
    }

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    
    // Calculate algorithm-based risk level
    let algorithmRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (percentage >= 70)      algorithmRiskLevel = 'HIGH';
    else if (percentage >= 40) algorithmRiskLevel = 'MEDIUM';
    else                       algorithmRiskLevel = 'LOW';

    // 🚨 CRITICAL SYMPTOM OVERRIDE: Any HIGH severity symptom = HIGH RISK
    let finalRiskLevel = algorithmRiskLevel;
    let riskOverride: string | undefined;

    if (criticalSymptoms.length > 0) {
      finalRiskLevel = 'HIGH';
      riskOverride = `Critical symptom detected: ${criticalSymptoms.join(', ')}`;
    }
    // 🟡 MEDIUM RISK RULE: 2+ MEDIUM severity symptoms = MEDIUM RISK (unless already HIGH)
    else if (mediumRiskSymptoms.length >= 2 && finalRiskLevel === 'LOW') {
      finalRiskLevel = 'MEDIUM';
      riskOverride = `Multiple concerning symptoms detected: ${mediumRiskSymptoms.join(', ')}`;
    }

    return { 
      score, 
      maxScore, 
      percentage: Math.round(percentage * 10) / 10, 
      riskLevel: finalRiskLevel, 
      answeredQuestions,
      criticalSymptoms: criticalSymptoms.length > 0 ? criticalSymptoms : undefined,
      mediumRiskSymptoms: mediumRiskSymptoms.length > 0 ? mediumRiskSymptoms : undefined,
      riskOverride
    };
  }
}
