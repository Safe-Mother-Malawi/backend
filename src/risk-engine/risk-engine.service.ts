/**
 * Risk Engine — Layered Model Stack
 *
 * Layer 1 — Core Engine: Weighted Scoring Model  R = Σ(wᵢ × xᵢ)
 * Layer 2 — Safety Layer: Rule-Based Decision Engine (clinical IF-THEN overrides)
 * Layer 3 — Flow Logic: Decision Tree (care pathway routing)
 *
 * Based on: Safe Mother Malawi Algorithm Document v1.0
 */
import { Injectable } from '@nestjs/common';

// ── Types ─────────────────────────────────────────────────────────────────────

export enum RiskCategory {
  LOW      = 'Low Risk',
  MODERATE = 'Moderate Risk',
  HIGH     = 'High Risk',
  CRITICAL = 'Seek Help Immediately',
}

export enum CarePathway {
  ROUTINE_ANC        = 'Routine ANC',
  ENHANCED_ANC       = 'Enhanced ANC Monitoring',
  URGENT_REFERRAL    = 'Urgent Referral Required',
  EMERGENCY          = 'Emergency — Seek Immediate Help',
  ROUTINE_PNC        = 'Routine PNC',
  ENHANCED_PNC       = 'Enhanced PNC Monitoring',
  NEONATAL_EMERGENCY = 'Neonatal Emergency',
}

export interface RiskEngineInput {
  // Prenatal symptoms (weighted)
  generalWellbeing?: number;      // 0=very well, 1=tired, 3=unwell, 5=pain
  headache?: number;              // 0=none, 1=mild, 4=severe, 6=severe+vision
  swelling?: number;              // 0=none, 2=mild feet, 5=hands+face, 7=sudden severe
  fetalMovement?: number;         // 0=normal, 3=less, 7=none, 0=too early
  bleedingDischarge?: number;     // 0=none, 3=spotting, 8=heavy, 4=unusual

  // Clinical readings (safety layer overrides)
  systolicBP?: number;
  diastolicBP?: number;
  hasHeavyBleeding?: boolean;
  hasSevereHeadacheWithVision?: boolean;
  hasSuddenSevereSwelling?: boolean;
  hasNoFetalMovement?: boolean;

  // Neonatal symptoms (weighted)
  breathing?: number;             // 0=normal, 3=fast, 6=very fast/grunting
  feeding?: number;               // 0=feeding well, 3=poor, 6=not feeding
  skinColor?: number;             // 0=normal, 2=pale, 5=yellow/blue
  temperature?: number;           // 0=normal, 3=mild fever, 6=high fever/cold
  activity?: number;              // 0=active, 3=less active, 6=very lethargic
  umbilicalCord?: number;         // 0=normal, 3=redness, 6=pus/smell
  wetNappies?: number;            // 0=normal, 3=fewer, 6=none

  // Neonatal clinical overrides
  hasNoBreathing?: boolean;
  hasSeizures?: boolean;
  hasBlueSkin?: boolean;
  babyAgeInDays?: number;

  patientType: 'prenatal' | 'neonatal';
}

export interface RiskEngineResult {
  score: number;
  riskCategory: RiskCategory;
  carePathway: CarePathway;
  message: string;
  clinicalFlags: string[];        // triggered safety-layer rules
  recommendations: string[];
  requiresImmediateAction: boolean;
}

@Injectable()
export class RiskEngineService {

  // ── Layer 1: Weighted Scoring ─────────────────────────────────────────────

  private computePrenatalScore(input: RiskEngineInput): number {
    return (
      (input.generalWellbeing ?? 0) +
      (input.headache ?? 0) +
      (input.swelling ?? 0) +
      (input.fetalMovement ?? 0) +
      (input.bleedingDischarge ?? 0)
    );
  }

  private computeNeonatalScore(input: RiskEngineInput): number {
    return (
      (input.breathing ?? 0) +
      (input.feeding ?? 0) +
      (input.skinColor ?? 0) +
      (input.temperature ?? 0) +
      (input.activity ?? 0) +
      (input.umbilicalCord ?? 0) +
      (input.wetNappies ?? 0)
    );
  }

  // ── Layer 2: Safety Layer — Rule-Based Clinical Overrides ─────────────────
  // IF-THEN rules that can escalate risk regardless of weighted score

  private applySafetyOverrides(
    input: RiskEngineInput,
    baseScore: number,
  ): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = baseScore;

    if (input.patientType === 'prenatal') {
      // BP > 160/110 → CRITICAL (pre-eclampsia / hypertensive emergency)
      if ((input.systolicBP ?? 0) > 160 || (input.diastolicBP ?? 0) > 110) {
        score = Math.max(score, 30);
        flags.push('BP > 160/110 — Hypertensive Emergency');
      }
      // BP > 140/90 → HIGH
      else if ((input.systolicBP ?? 0) > 140 || (input.diastolicBP ?? 0) > 90) {
        score = Math.max(score, 15);
        flags.push('BP > 140/90 — Elevated Blood Pressure');
      }
      // Heavy bleeding → CRITICAL
      if (input.hasHeavyBleeding) {
        score = Math.max(score, 30);
        flags.push('Heavy Bleeding — Immediate Emergency');
      }
      // Severe headache + vision changes → HIGH
      if (input.hasSevereHeadacheWithVision) {
        score = Math.max(score, 20);
        flags.push('Severe Headache with Visual Disturbance — Pre-eclampsia Risk');
      }
      // Sudden severe swelling → HIGH
      if (input.hasSuddenSevereSwelling) {
        score = Math.max(score, 18);
        flags.push('Sudden Severe Swelling — Possible Pre-eclampsia');
      }
      // No fetal movement → CRITICAL
      if (input.hasNoFetalMovement) {
        score = Math.max(score, 25);
        flags.push('No Fetal Movement — Urgent Assessment Required');
      }
    }

    if (input.patientType === 'neonatal') {
      // No breathing → CRITICAL
      if (input.hasNoBreathing) {
        score = Math.max(score, 30);
        flags.push('No Breathing — Neonatal Emergency');
      }
      // Seizures → CRITICAL
      if (input.hasSeizures) {
        score = Math.max(score, 30);
        flags.push('Seizures — Neonatal Emergency');
      }
      // Blue skin (cyanosis) → CRITICAL
      if (input.hasBlueSkin) {
        score = Math.max(score, 28);
        flags.push('Cyanosis (Blue Skin) — Respiratory Emergency');
      }
      // Very young baby (< 3 days) with any symptoms → escalate
      if ((input.babyAgeInDays ?? 99) < 3 && baseScore > 3) {
        score = Math.max(score, score + 5);
        flags.push('Newborn < 3 days — Elevated Vigilance Required');
      }
    }

    return { score, flags };
  }

  // ── Layer 3: Decision Tree — Care Pathway Routing ─────────────────────────
  // Maps risk category + patient type to the appropriate care pathway

  private determineCarePathway(
    riskCategory: RiskCategory,
    patientType: 'prenatal' | 'neonatal',
    flags: string[],
  ): CarePathway {
    if (patientType === 'prenatal') {
      if (riskCategory === RiskCategory.CRITICAL) return CarePathway.EMERGENCY;
      if (riskCategory === RiskCategory.HIGH)     return CarePathway.URGENT_REFERRAL;
      if (riskCategory === RiskCategory.MODERATE) return CarePathway.ENHANCED_ANC;
      return CarePathway.ROUTINE_ANC;
    } else {
      if (riskCategory === RiskCategory.CRITICAL) return CarePathway.NEONATAL_EMERGENCY;
      if (riskCategory === RiskCategory.HIGH)     return CarePathway.URGENT_REFERRAL;
      if (riskCategory === RiskCategory.MODERATE) return CarePathway.ENHANCED_PNC;
      return CarePathway.ROUTINE_PNC;
    }
  }

  // ── Risk category from final score ────────────────────────────────────────

  private categorise(score: number, patientType: 'prenatal' | 'neonatal'): RiskCategory {
    if (patientType === 'neonatal') {
      if (score <= 5)  return RiskCategory.LOW;
      if (score <= 14) return RiskCategory.MODERATE;
      if (score <= 24) return RiskCategory.HIGH;
      return RiskCategory.CRITICAL;
    }
    // Prenatal
    if (score <= 4)  return RiskCategory.LOW;
    if (score <= 12) return RiskCategory.MODERATE;
    if (score <= 20) return RiskCategory.HIGH;
    return RiskCategory.CRITICAL;
  }

  // ── Message + recommendations ─────────────────────────────────────────────

  private buildOutput(
    riskCategory: RiskCategory,
    carePathway: CarePathway,
    flags: string[],
    patientType: 'prenatal' | 'neonatal',
  ): { message: string; recommendations: string[] } {
    const messages: Record<RiskCategory, string> = {
      [RiskCategory.LOW]:
        'You appear to be in good health. Continue your regular care visits and maintain a healthy lifestyle.',
      [RiskCategory.MODERATE]:
        'Some symptoms require monitoring. Please contact your clinician within 24–48 hours.',
      [RiskCategory.HIGH]:
        'Your symptoms indicate a high-risk condition. Please visit your health centre today.',
      [RiskCategory.CRITICAL]:
        'URGENT: Your symptoms require immediate medical attention. Go to the nearest hospital now or call 116.',
    };

    const recommendations: Record<RiskCategory, string[]> = {
      [RiskCategory.LOW]: [
        'Attend all scheduled ANC/PNC visits',
        'Maintain a balanced diet and stay hydrated',
        'Rest adequately and avoid heavy lifting',
      ],
      [RiskCategory.MODERATE]: [
        'Contact your clinician within 24–48 hours',
        'Monitor symptoms closely and log any changes',
        'Avoid strenuous activity until reviewed',
      ],
      [RiskCategory.HIGH]: [
        'Visit your health centre today',
        'Do not delay — bring your health card',
        'Inform a family member or caregiver',
        ...(flags.length > 0 ? [`Clinical flags: ${flags.join(', ')}`] : []),
      ],
      [RiskCategory.CRITICAL]: [
        'Go to the nearest hospital IMMEDIATELY',
        'Call the emergency hotline: 116',
        'Call an ambulance: 998',
        'Do not wait — this is a medical emergency',
        ...(flags.length > 0 ? [`Triggered alerts: ${flags.join(', ')}`] : []),
      ],
    };

    return {
      message: messages[riskCategory],
      recommendations: recommendations[riskCategory],
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  assess(input: RiskEngineInput): RiskEngineResult {
    // Layer 1: Weighted score
    const baseScore = input.patientType === 'prenatal'
      ? this.computePrenatalScore(input)
      : this.computeNeonatalScore(input);

    // Layer 2: Safety overrides
    const { score, flags } = this.applySafetyOverrides(input, baseScore);

    // Categorise
    const riskCategory = this.categorise(score, input.patientType);

    // Layer 3: Care pathway
    const carePathway = this.determineCarePathway(riskCategory, input.patientType, flags);

    // Build output
    const { message, recommendations } = this.buildOutput(
      riskCategory, carePathway, flags, input.patientType,
    );

    return {
      score,
      riskCategory,
      carePathway,
      message,
      clinicalFlags: flags,
      recommendations,
      requiresImmediateAction:
        riskCategory === RiskCategory.CRITICAL || riskCategory === RiskCategory.HIGH,
    };
  }
}
