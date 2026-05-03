import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthFacility } from './entities/health-facility.entity';
import { FACILITY_SEED } from './seed/facilities.seed';

@Injectable()
export class HealthFacilitiesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(HealthFacility)
    private readonly repo: Repository<HealthFacility>,
  ) {}

  /** Seed on first boot if table is empty, or add missing districts */
  async onApplicationBootstrap() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(FACILITY_SEED.map(f => this.repo.create(f)));
      return;
    }
    // Add any facilities from the seed that don't exist yet (by facilityName + district)
    const existing = await this.repo.find({ select: ['facilityName', 'district'] });
    const existingSet = new Set(existing.map(f => `${f.district}|${f.facilityName}`));
    const toAdd = FACILITY_SEED.filter(
      f => !existingSet.has(`${f.district}|${f.facilityName}`)
    );
    if (toAdd.length > 0) {
      await this.repo.save(toAdd.map(f => this.repo.create(f)));
    }
  }

  /** All distinct regions */
  async getRegions(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.region', 'region')
      .orderBy('f.region', 'ASC')
      .getRawMany<{ region: string }>();
    return rows.map(r => r.region);
  }

  /** All distinct districts across all regions */
  async getAllDistricts(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.district', 'district')
      .orderBy('f.district', 'ASC')
      .getRawMany<{ district: string }>();
    return rows.map(r => r.district);
  }

  /** Zones for a region */
  async getZones(region: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.zone', 'zone')
      .where('f.region = :region', { region })
      .orderBy('f.zone', 'ASC')
      .getRawMany<{ zone: string }>();
    return rows.map(r => r.zone);
  }

  /** Districts for a zone */
  async getDistricts(zone: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.district', 'district')
      .where('f.zone = :zone', { zone })
      .orderBy('f.district', 'ASC')
      .getRawMany<{ district: string }>();
    return rows.map(r => r.district);
  }

  /** All facilities for a district (case-insensitive) */
  async getFacilitiesByDistrict(district: string): Promise<HealthFacility[]> {
    return this.repo
      .createQueryBuilder('f')
      .where('LOWER(f.district) = LOWER(:district)', { district })
      .orderBy('f.facilityName', 'ASC')
      .getMany();
  }

  /** Single facility by name (for auto-fill) */
  async getFacilityByName(name: string): Promise<HealthFacility | null> {
    return this.repo.findOne({ where: { facilityName: name } });
  }

  /** All facilities with optional filters and pagination */
  async findAll(options?: {
    facilityType?: string;
    managingAuthority?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<HealthFacility[]> {
    let query = this.repo.createQueryBuilder('f');

    if (options?.facilityType) {
      query = query.where('f.facilityType = :facilityType', { facilityType: options.facilityType });
    }

    if (options?.managingAuthority) {
      query = query.andWhere('f.managingAuthority = :managingAuthority', { managingAuthority: options.managingAuthority });
    }

    if (options?.search) {
      const searchTerm = `%${options.search}%`;
      query = query.andWhere(
        '(LOWER(f.facilityName) LIKE LOWER(:search) OR LOWER(f.district) LIKE LOWER(:search))',
        { search: searchTerm }
      );
    }

    query = query.orderBy('f.region', 'ASC')
      .addOrderBy('f.district', 'ASC')
      .addOrderBy('f.facilityName', 'ASC');

    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      query = query.skip(skip).take(options.limit);
    }

    return query.getMany();
  }

  /** Create a new facility */
  async create(data: Partial<HealthFacility>): Promise<HealthFacility> {
    const facility = this.repo.create(data);
    return this.repo.save(facility);
  }
}
