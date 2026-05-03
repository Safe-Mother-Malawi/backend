import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FeedingLog } from './entities/feeding-log.entity';
import { SleepLog } from './entities/sleep-log.entity';
import { Vaccine, VaccineStatus } from './entities/vaccine.entity';
import { CreateFeedingLogDto } from './dto/create-feeding-log.dto';
import { CreateSleepLogDto } from './dto/create-sleep-log.dto';

// ── Malawi EPI vaccine schedule ───────────────────────────────────────────────
const EPI_SCHEDULE = [
  { name: 'BCG',          ageLabel: 'At birth',  dueDayAge: 0   },
  { name: 'OPV 0',        ageLabel: 'At birth',  dueDayAge: 0   },
  { name: 'OPV 1 + Penta 1 + PCV 1 + Rota 1', ageLabel: '6 weeks',  dueDayAge: 42  },
  { name: 'OPV 2 + Penta 2 + PCV 2 + Rota 2', ageLabel: '10 weeks', dueDayAge: 70  },
  { name: 'OPV 3 + Penta 3 + PCV 3 + Rota 3', ageLabel: '14 weeks', dueDayAge: 98  },
  { name: 'Measles + Rubella (MR)',             ageLabel: '9 months', dueDayAge: 274 },
];

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(FeedingLog)
    private readonly feedingRepo: Repository<FeedingLog>,
    @InjectRepository(SleepLog)
    private readonly sleepRepo: Repository<SleepLog>,
    @InjectRepository(Vaccine)
    private readonly vaccineRepo: Repository<Vaccine>,
  ) {}

  // ── Feeding logs ──────────────────────────────────────────────────────────

  async logFeeding(dto: CreateFeedingLogDto): Promise<FeedingLog> {
    const log = this.feedingRepo.create({
      ...dto,
      feedTime: new Date(dto.feedTime),
    });
    return this.feedingRepo.save(log);
  }

  async getFeedingLogs(neonatalPatientId: string): Promise<FeedingLog[]> {
    return this.feedingRepo.find({
      where: { neonatalPatientId },
      order: { feedTime: 'DESC' },
    });
  }

  async getTodayFeedingLogs(neonatalPatientId: string): Promise<FeedingLog[]> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    return this.feedingRepo.find({
      where: { neonatalPatientId, feedTime: Between(start, end) },
      order: { feedTime: 'DESC' },
    });
  }

  async deleteFeedingLog(id: string): Promise<void> {
    const log = await this.feedingRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Feeding log not found.');
    await this.feedingRepo.remove(log);
  }

  // ── Sleep logs ────────────────────────────────────────────────────────────

  async logSleep(dto: CreateSleepLogDto): Promise<SleepLog> {
    const log = this.sleepRepo.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });
    return this.sleepRepo.save(log);
  }

  async getSleepLogs(neonatalPatientId: string): Promise<SleepLog[]> {
    return this.sleepRepo.find({
      where: { neonatalPatientId },
      order: { startTime: 'DESC' },
    });
  }

  async getTodaySleepLogs(neonatalPatientId: string): Promise<SleepLog[]> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    return this.sleepRepo.find({
      where: { neonatalPatientId, startTime: Between(start, end) },
      order: { startTime: 'DESC' },
    });
  }

  async deleteSleepLog(id: string): Promise<void> {
    const log = await this.sleepRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Sleep log not found.');
    await this.sleepRepo.remove(log);
  }

  // ── Vaccines ──────────────────────────────────────────────────────────────

  /**
   * Seed the standard Malawi EPI schedule for a newly registered neonatal patient.
   * Call this once after creating a NeonatalPatient.
   */
  async seedVaccines(neonatalPatientId: string, babyDob: Date): Promise<Vaccine[]> {
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - babyDob.getTime()) / 86_400_000);

    const vaccines = EPI_SCHEDULE.map((v) => {
      let status: VaccineStatus;
      if (ageInDays > v.dueDayAge + 7) {
        status = VaccineStatus.UPCOMING; // overdue — mark upcoming for follow-up
      } else if (ageInDays >= v.dueDayAge) {
        status = VaccineStatus.UPCOMING;
      } else {
        status = VaccineStatus.SCHEDULED;
      }
      return this.vaccineRepo.create({ neonatalPatientId, ...v, status });
    });

    return this.vaccineRepo.save(vaccines);
  }

  async getVaccines(neonatalPatientId: string): Promise<Vaccine[]> {
    return this.vaccineRepo.find({
      where: { neonatalPatientId },
      order: { dueDayAge: 'ASC' },
    });
  }

  async markVaccineGiven(id: string): Promise<Vaccine> {
    const vaccine = await this.vaccineRepo.findOne({ where: { id } });
    if (!vaccine) throw new NotFoundException('Vaccine record not found.');
    vaccine.status = VaccineStatus.GIVEN;
    vaccine.givenDate = new Date().toISOString().split('T')[0];
    return this.vaccineRepo.save(vaccine);
  }

  async getNextVaccine(neonatalPatientId: string): Promise<Vaccine | null> {
    return this.vaccineRepo.findOne({
      where: { neonatalPatientId, status: VaccineStatus.UPCOMING },
      order: { dueDayAge: 'ASC' },
    });
  }
}
