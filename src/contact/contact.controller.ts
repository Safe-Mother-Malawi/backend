import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

class ContactDto {
  @IsNotEmpty() @IsString() name: string;
  @IsEmail() email: string;
  @IsNotEmpty() @IsString() subject: string;
  @IsNotEmpty() @IsString() message: string;
}

class SupportContactDto {
  @IsNotEmpty() @IsString() subject: string;
  @IsNotEmpty() @IsString() message: string;
}

@Controller('support')
export class SupportController {
  /**
   * POST /support/contact
   * Authenticated user support contact form submission.
   * In production, wire this to an email service (SendGrid, Mailgun, etc.)
   */
  @Post('contact')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  submitSupport(@CurrentUser() user: User, @Body() dto: SupportContactDto) {
    // TODO: integrate email service
    console.log(`[Support Contact] From: ${user.fullName} <${user.email}> — ${dto.subject}`);
    console.log(`Message: ${dto.message}`);
    return { message: 'Thank you for your message. Our support team will get back to you shortly.' };
  }
}

@Controller('contact')
export class ContactController {
  /**
   * POST /contact
   * Landing page contact form submission.
   * In production, wire this to an email service (SendGrid, Mailgun, etc.)
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  submit(@Body() dto: ContactDto) {
    // TODO: integrate email service
    console.log(`[Contact Form] From: ${dto.name} <${dto.email}> — ${dto.subject}`);
    return { message: 'Thank you for your message. We will get back to you shortly.' };
  }
}
