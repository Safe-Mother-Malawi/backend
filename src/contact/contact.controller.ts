import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
  private readonly logger = new Logger(SupportController.name);

  constructor(private readonly configService: ConfigService) {}

  @Post('contact')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async submitSupport(@CurrentUser() user: User, @Body() dto: SupportContactDto) {
    await this._sendEmail({
      to: this.configService.get('EMAIL_USER', 'support@safemothermalawi.mw'),
      subject: `[Support] ${dto.subject}`,
      html: `<p><strong>From:</strong> ${user.fullName} &lt;${user.email ?? user.phone}&gt; (${user.role})</p>
             <p><strong>Subject:</strong> ${dto.subject}</p>
             <hr/>
             <p>${dto.message.replace(/\n/g, '<br/>')}</p>`,
    });
    return { message: 'Thank you for your message. Our support team will get back to you shortly.' };
  }

  private async _sendEmail(opts: { to: string; subject: string; html: string }) {
    const host = this.configService.get('EMAIL_HOST');
    const user = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASSWORD');
    const from = this.configService.get('EMAIL_FROM', user);
    const fromName = this.configService.get('EMAIL_FROM_NAME', 'Safe Mother Malawi');

    if (!host || !user || !pass) {
      this.logger.warn(`[Email] Not configured — would send: ${opts.subject}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.configService.get('EMAIL_PORT', '587')),
      secure: this.configService.get('EMAIL_PORT') === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `${fromName} <${from}>`,
      ...opts,
    });
  }
}

@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(private readonly configService: ConfigService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submit(@Body() dto: ContactDto) {
    const host = this.configService.get('EMAIL_HOST');
    const emailUser = this.configService.get('EMAIL_USER');
    const pass = this.configService.get('EMAIL_PASSWORD');
    const to = this.configService.get('EMAIL_USER', 'info@safemothermalawi.mw');
    const from = this.configService.get('EMAIL_FROM', emailUser);
    const fromName = this.configService.get('EMAIL_FROM_NAME', 'Safe Mother Malawi');

    if (host && emailUser && pass) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: parseInt(this.configService.get('EMAIL_PORT', '587')),
          secure: this.configService.get('EMAIL_PORT') === '465',
          auth: { user: emailUser, pass },
        });
        await transporter.sendMail({
          from: `${fromName} <${from}>`,
          to,
          subject: `[Contact Form] ${dto.subject}`,
          html: `<p><strong>From:</strong> ${dto.name} &lt;${dto.email}&gt;</p>
                 <p><strong>Subject:</strong> ${dto.subject}</p>
                 <hr/>
                 <p>${dto.message.replace(/\n/g, '<br/>')}</p>`,
          replyTo: dto.email,
        });
      } catch (err) {
        this.logger.error('Failed to send contact form email:', err);
      }
    } else {
      this.logger.warn(`[Email] Not configured — contact from ${dto.name} <${dto.email}>: ${dto.subject}`);
    }

    return { message: 'Thank you for your message. We will get back to you shortly.' };
  }
}
