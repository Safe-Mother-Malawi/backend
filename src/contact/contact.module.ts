import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactController, SupportController } from './contact.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ContactController, SupportController],
})
export class ContactModule {}
