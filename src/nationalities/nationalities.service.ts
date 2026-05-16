import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nationality } from './entities/nationality.entity';

@Injectable()
export class NationalitiesService {
  constructor(
    @InjectRepository(Nationality)
    private readonly nationalityRepository: Repository<Nationality>,
  ) {}

  /**
   * Get all active nationalities, sorted by sortOrder then name
   */
  async findAll(): Promise<Nationality[]> {
    return this.nationalityRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get nationality by ID
   */
  async findOne(id: number): Promise<Nationality | null> {
    return this.nationalityRepository.findOne({
      where: { id, isActive: true },
    });
  }

  /**
   * Get nationality by name
   */
  async findByName(name: string): Promise<Nationality | null> {
    return this.nationalityRepository.findOne({
      where: { name, isActive: true },
    });
  }

  /**
   * Create a new nationality
   */
  async create(name: string, code: string, sortOrder = 0): Promise<Nationality> {
    const nationality = this.nationalityRepository.create({
      name,
      code,
      sortOrder,
    });
    return this.nationalityRepository.save(nationality);
  }

  /**
   * Seed default nationalities
   */
  async seed(): Promise<void> {
    const count = await this.nationalityRepository.count();
    if (count > 0) {
      console.log('Nationalities already seeded, skipping...');
      return;
    }

    const nationalities = [
      // African countries (prioritized for Malawi context)
      { name: 'Malawian', code: 'MW', sortOrder: 1 },
      { name: 'Mozambican', code: 'MZ', sortOrder: 2 },
      { name: 'Zambian', code: 'ZM', sortOrder: 3 },
      { name: 'Tanzanian', code: 'TZ', sortOrder: 4 },
      { name: 'South African', code: 'ZA', sortOrder: 5 },
      { name: 'Zimbabwean', code: 'ZW', sortOrder: 6 },
      { name: 'Botswanan', code: 'BW', sortOrder: 7 },
      { name: 'Kenyan', code: 'KE', sortOrder: 8 },
      { name: 'Ugandan', code: 'UG', sortOrder: 9 },
      { name: 'Ethiopian', code: 'ET', sortOrder: 10 },
      { name: 'Nigerian', code: 'NG', sortOrder: 11 },
      { name: 'Ghanaian', code: 'GH', sortOrder: 12 },
      
      // Other common nationalities
      { name: 'British', code: 'GB', sortOrder: 20 },
      { name: 'American', code: 'US', sortOrder: 21 },
      { name: 'Indian', code: 'IN', sortOrder: 22 },
      { name: 'Chinese', code: 'CN', sortOrder: 23 },
      { name: 'Portuguese', code: 'PT', sortOrder: 24 },
      { name: 'Lebanese', code: 'LB', sortOrder: 25 },
      { name: 'Pakistani', code: 'PK', sortOrder: 26 },
      { name: 'Bangladeshi', code: 'BD', sortOrder: 27 },
      
      // Additional African countries
      { name: 'Angolan', code: 'AO', sortOrder: 30 },
      { name: 'Congolese (DRC)', code: 'CD', sortOrder: 31 },
      { name: 'Congolese (Republic)', code: 'CG', sortOrder: 32 },
      { name: 'Rwandan', code: 'RW', sortOrder: 33 },
      { name: 'Burundian', code: 'BI', sortOrder: 34 },
      { name: 'Sudanese', code: 'SD', sortOrder: 35 },
      { name: 'Somali', code: 'SO', sortOrder: 36 },
      { name: 'Eritrean', code: 'ER', sortOrder: 37 },
      { name: 'Cameroonian', code: 'CM', sortOrder: 38 },
      { name: 'Ivorian', code: 'CI', sortOrder: 39 },
      { name: 'Senegalese', code: 'SN', sortOrder: 40 },
      { name: 'Malian', code: 'ML', sortOrder: 41 },
      { name: 'Burkinabe', code: 'BF', sortOrder: 42 },
      { name: 'Nigerien', code: 'NE', sortOrder: 43 },
      { name: 'Chadian', code: 'TD', sortOrder: 44 },
      { name: 'Central African', code: 'CF', sortOrder: 45 },
      { name: 'Gabonese', code: 'GA', sortOrder: 46 },
      { name: 'Equatorial Guinean', code: 'GQ', sortOrder: 47 },
      { name: 'Togolese', code: 'TG', sortOrder: 48 },
      { name: 'Beninese', code: 'BJ', sortOrder: 49 },
      { name: 'Liberian', code: 'LR', sortOrder: 50 },
      { name: 'Sierra Leonean', code: 'SL', sortOrder: 51 },
      { name: 'Guinean', code: 'GN', sortOrder: 52 },
      { name: 'Gambian', code: 'GM', sortOrder: 53 },
      { name: 'Cape Verdean', code: 'CV', sortOrder: 54 },
      { name: 'Mauritanian', code: 'MR', sortOrder: 55 },
      { name: 'Moroccan', code: 'MA', sortOrder: 56 },
      { name: 'Algerian', code: 'DZ', sortOrder: 57 },
      { name: 'Tunisian', code: 'TN', sortOrder: 58 },
      { name: 'Libyan', code: 'LY', sortOrder: 59 },
      { name: 'Egyptian', code: 'EG', sortOrder: 60 },
      { name: 'Namibian', code: 'NA', sortOrder: 61 },
      { name: 'Swazi', code: 'SZ', sortOrder: 62 },
      { name: 'Lesothan', code: 'LS', sortOrder: 63 },
      { name: 'Malagasy', code: 'MG', sortOrder: 64 },
      { name: 'Mauritian', code: 'MU', sortOrder: 65 },
      { name: 'Seychellois', code: 'SC', sortOrder: 66 },
      { name: 'Comorian', code: 'KM', sortOrder: 67 },
      { name: 'Djiboutian', code: 'DJ', sortOrder: 68 },
      
      // Other nationalities (alphabetical)
      { name: 'Other', code: 'XX', sortOrder: 999 },
    ];

    for (const nationality of nationalities) {
      await this.create(nationality.name, nationality.code, nationality.sortOrder);
    }

    console.log(`Seeded ${nationalities.length} nationalities`);
  }
}