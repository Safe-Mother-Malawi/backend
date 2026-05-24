import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthFacility } from './entities/health-facility.entity';
import { FACILITY_SEED } from './seed/facilities.seed';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ActivityAction } from '../activity-log/entities/activity-log.entity';

@Injectable()
export class HealthFacilitiesService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(HealthFacility)
    private readonly repo: Repository<HealthFacility>,
    private readonly activityLog: ActivityLogService,
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

  /** All distinct zones across all regions */
  async getAllZones(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.zone', 'zone')
      .orderBy('f.zone', 'ASC')
      .getRawMany<{ zone: string }>();
    return rows.map(r => r.zone);
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

  /** Districts for a specific region and zone combination */
  async getDistrictsByRegionAndZone(region: string, zone: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.district', 'district')
      .where('f.region = :region', { region })
      .andWhere('f.zone = :zone', { zone })
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
    const saved = await this.repo.save(facility);
    
    await this.activityLog.log({
      action: ActivityAction.FACILITY_CREATED,
      description: `Facility created: ${saved.facilityName}`,
      resourceType: 'facility',
      resourceId: saved.id,
      meta: { facilityName: saved.facilityName, region: saved.region, district: saved.district },
    });
    
    return saved;
  }

  /** Find facility by ID */
  async findById(id: string): Promise<HealthFacility | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Update a facility */
  async update(id: string, data: Partial<HealthFacility>): Promise<HealthFacility | null> {
    const facility = await this.repo.findOne({ where: { id } });
    if (!facility) return null;
    
    // Track changes for audit log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const key of Object.keys(data)) {
      if (facility[key] !== data[key]) {
        changes[key] = { old: facility[key], new: data[key] };
      }
    }
    
    Object.assign(facility, data);
    const updated = await this.repo.save(facility);
    
    // Log the update with change tracking
    await this.activityLog.log({
      action: ActivityAction.FACILITY_UPDATED,
      description: `Facility updated: ${updated.facilityName}`,
      resourceType: 'facility',
      resourceId: updated.id,
      meta: { facilityName: updated.facilityName, changes },
    });
    
    return updated;
  }

  /** Delete a facility */
  async delete(id: string): Promise<boolean> {
    const facility = await this.repo.findOne({ where: { id } });
    if (!facility) return false;
    
    const result = await this.repo.delete(id);
    const deleted = (result.affected ?? 0) > 0;
    
    if (deleted) {
      // Log the deletion with facility details
      await this.activityLog.log({
        action: ActivityAction.FACILITY_DELETED,
        description: `Facility deleted: ${facility.facilityName}`,
        resourceType: 'facility',
        resourceId: id,
        meta: { facilityName: facility.facilityName, region: facility.region, district: facility.district },
      });
    }
    
    return deleted;
  }

  /** Get all distinct facility types */
  async getFacilityTypes(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.facilityType', 'facilityType')
      .where('f.facilityType IS NOT NULL')
      .orderBy('f.facilityType', 'ASC')
      .getRawMany<{ facilityType: string }>();
    return rows.map(r => r.facilityType).filter(Boolean);
  }

  /** Get all distinct managing authorities */
  async getManagingAuthorities(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.managingAuthority', 'managingAuthority')
      .where('f.managingAuthority IS NOT NULL')
      .orderBy('f.managingAuthority', 'ASC')
      .getRawMany<{ managingAuthority: string }>();
    return rows.map(r => r.managingAuthority).filter(Boolean);
  }

  /** Get facility types for a specific region */
  async getFacilityTypesByRegion(region: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.facilityType', 'facilityType')
      .where('f.region = :region', { region })
      .andWhere('f.facilityType IS NOT NULL')
      .orderBy('f.facilityType', 'ASC')
      .getRawMany<{ facilityType: string }>();
    return rows.map(r => r.facilityType).filter(Boolean);
  }

  /** Get managing authorities for a specific region */
  async getManagingAuthoritiesByRegion(region: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.managingAuthority', 'managingAuthority')
      .where('f.region = :region', { region })
      .andWhere('f.managingAuthority IS NOT NULL')
      .orderBy('f.managingAuthority', 'ASC')
      .getRawMany<{ managingAuthority: string }>();
    return rows.map(r => r.managingAuthority).filter(Boolean);
  }

  /** Get facility types for a specific zone */
  async getFacilityTypesByZone(zone: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.facilityType', 'facilityType')
      .where('f.zone = :zone', { zone })
      .andWhere('f.facilityType IS NOT NULL')
      .orderBy('f.facilityType', 'ASC')
      .getRawMany<{ facilityType: string }>();
    return rows.map(r => r.facilityType).filter(Boolean);
  }

  /** Get managing authorities for a specific zone */
  async getManagingAuthoritiesByZone(zone: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.managingAuthority', 'managingAuthority')
      .where('f.zone = :zone', { zone })
      .andWhere('f.managingAuthority IS NOT NULL')
      .orderBy('f.managingAuthority', 'ASC')
      .getRawMany<{ managingAuthority: string }>();
    return rows.map(r => r.managingAuthority).filter(Boolean);
  }

  /** Get facility types for a specific district */
  async getFacilityTypesByDistrict(district: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.facilityType', 'facilityType')
      .where('LOWER(f.district) = LOWER(:district)', { district })
      .andWhere('f.facilityType IS NOT NULL')
      .orderBy('f.facilityType', 'ASC')
      .getRawMany<{ facilityType: string }>();
    return rows.map(r => r.facilityType).filter(Boolean);
  }

  /** Get managing authorities for a specific district */
  async getManagingAuthoritiesByDistrict(district: string): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('f')
      .select('DISTINCT f.managingAuthority', 'managingAuthority')
      .where('LOWER(f.district) = LOWER(:district)', { district })
      .andWhere('f.managingAuthority IS NOT NULL')
      .orderBy('f.managingAuthority', 'ASC')
      .getRawMany<{ managingAuthority: string }>();
    return rows.map(r => r.managingAuthority).filter(Boolean);
  }

  /** Get statistics for facilities in a district */
  async getFacilitiesStats(district: string): Promise<{
    totalFacilities: number;
    byType: { type: string; count: number }[];
    byAuthority: { authority: string; count: number }[];
    byUrbanRural: { classification: string; count: number }[];
  }> {
    const facilities = await this.getFacilitiesByDistrict(district);
    
    const totalFacilities = facilities.length;
    
    // Group by facility type
    const typeMap = new Map<string, number>();
    facilities.forEach(f => {
      typeMap.set(f.facilityType, (typeMap.get(f.facilityType) || 0) + 1);
    });
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    
    // Group by managing authority
    const authorityMap = new Map<string, number>();
    facilities.forEach(f => {
      authorityMap.set(f.managingAuthority, (authorityMap.get(f.managingAuthority) || 0) + 1);
    });
    const byAuthority = Array.from(authorityMap.entries())
      .map(([authority, count]) => ({ authority, count }))
      .sort((a, b) => b.count - a.count);
    
    // Group by urban/rural
    const urbanRuralMap = new Map<string, number>();
    facilities.forEach(f => {
      urbanRuralMap.set(f.urbanRural, (urbanRuralMap.get(f.urbanRural) || 0) + 1);
    });
    const byUrbanRural = Array.from(urbanRuralMap.entries())
      .map(([classification, count]) => ({ classification, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalFacilities,
      byType,
      byAuthority,
      byUrbanRural,
    };
  }
}
