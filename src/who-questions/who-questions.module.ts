import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhoQuestion } from './entities/who-question.entity';
import { WhoQuestionsService } from './who-questions.service';
import { WhoQuestionsController } from './who-questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WhoQuestion])],
  providers: [WhoQuestionsService],
  controllers: [WhoQuestionsController],
  exports: [WhoQuestionsService],
})
export class WhoQuestionsModule {}
