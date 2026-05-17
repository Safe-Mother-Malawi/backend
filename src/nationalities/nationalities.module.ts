import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Nationality } from "./entities/nationality.entity";
import { NationalitiesService } from "./nationalities.service";
import { NationalitiesController } from "./nationalities.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Nationality])],
  controllers: [NationalitiesController],
  providers: [NationalitiesService],
  exports: [NationalitiesService],
})
export class NationalitiesModule {}
