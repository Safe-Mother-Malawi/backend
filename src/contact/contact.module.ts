import { Module } from '@nestjs/common';
import { ContactController, SupportController } from './contact.controller';

@Module({ controllers: [ContactController, SupportController] })
export class ContactModule {}
