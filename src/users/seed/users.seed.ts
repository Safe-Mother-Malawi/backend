import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeedService {
  private readonly logger = new Logger(UsersSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed() {
    const count = await this.userRepository.count();
    
    // Only seed if database is empty
    if (count > 0) {
      this.logger.log('Users already exist, skipping seed');
      return;
    }

    this.logger.log('Seeding default users...');

    const defaultUsers = [
      {
        email: 'admin@safemothermalawi.mw',
        phone: '+265991234567', // Default phone for admin
        password: 'Admin@123',
        fullName: 'System Administrator',
        role: 'admin',
        district: 'Lilongwe',
      },
      {
        email: 'dho@safemothermalawi.mw',
        phone: '+265991234568', // Default phone for DHO
        password: 'Dho@123',
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
