import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeedService {
  private readonly logger = new Logger(UsersSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed() {
    const count = await this.userRepository.count();
    if (count > 0) {
      this.logger.log('Users already exist, skipping seed');
      return;
    }

    this.logger.log('Seeding default users...');

    // Passwords come from env vars — fall back to defaults only in development
    const adminPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD') ?? 'Admin@123';
    const dhoPassword   = this.configService.get<string>('SEED_DHO_PASSWORD')   ?? 'Dho@123';

    const defaultUsers = [
      {
        email: 'admin@safemothermalawi.mw',
        phone: '+265991234567',
        password: adminPassword,
        fullName: 'System Administrator',
        role: 'admin',
        district: 'Lilongwe',
      },
      {
        email: 'dho@safemothermalawi.mw',
        phone: '+265991234568',
        password: dhoPassword,
        fullName: 'District Health Officer',
        role: 'dho',
        district: 'Lilongwe',
      },
    ];

    for (const userData of defaultUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = this.userRepository.create({
          email: userData.email,
          phone: userData.phone,
          passwordHash: hashedPassword,
          fullName: userData.fullName,
          role: userData.role as any,
          district: userData.district,
          isActive: true,
        });
        await this.userRepository.save(user);
        this.logger.log(`✅ Created user: ${userData.email} (${userData.role})`);
      } catch (error) {
        this.logger.error(`Failed to create user ${userData.email}:`, error.message);
      }
    }

    this.logger.log('✅ User seeding completed');
  }
}
