import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ReminderStatus } from './entities/reminder.entity';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Create a new reminder
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(user.id, dto);
  }

  /**
   * Get all reminders for the current user
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: User) {
    return this.remindersService.findByUser(user.id);
  }

  /**
   * Get pending reminders for the current user
   */
  @Get('pending')
  @HttpCode(HttpStatus.OK)
  async findPending(@CurrentUser() user: User) {
    return this.remindersService.findPendingByUser(user.id);
  }

  /**
   * Get reminders for a date range
   */
  @Get('range')
  @HttpCode(HttpStatus.OK)
  async findByDateRange(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate query parameters are required');
    }
    return this.remindersService.findByDateRange(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Get reminder statistics
   */
  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  async getStatistics(@CurrentUser() user: User) {
    return this.remindersService.getStatistics(user.id);
  }

  /**
   * Get a specific reminder
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string) {
    const reminder = await this.remindersService.findById(id);
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    return reminder;
  }

  /**
   * Update reminder status
   */
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReminderStatus,
  ) {
    const reminder = await this.remindersService.updateStatus(id, status);
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    return reminder;
  }

  /**
   * Acknowledge a reminder
   */
  @Put(':id/acknowledge')
  @HttpCode(HttpStatus.OK)
  async acknowledge(@Param('id') id: string) {
    const reminder = await this.remindersService.acknowledge(id);
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    return reminder;
  }

  /**
   * Reschedule a reminder
   */
  @Put(':id/reschedule')
  @HttpCode(HttpStatus.OK)
  async reschedule(
    @Param('id') id: string,
    @Body('scheduledFor') scheduledFor: string,
  ) {
    const reminder = await this.remindersService.reschedule(id, new Date(scheduledFor));
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    return reminder;
  }

  /**
   * Cancel a reminder
   */
  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string) {
    const reminder = await this.remindersService.cancel(id);
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    return reminder;
  }

  /**
   * Delete a reminder
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.remindersService.delete(id);
    if (!result) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    return { message: 'Reminder deleted successfully' };
  }
}
