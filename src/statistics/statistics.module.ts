import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { DashboardController, StatisticsController } from './statistics.controller.js';
import { StatisticsRepository } from './statistics.repository.js';
import { StatisticsService } from './statistics.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController, StatisticsController],
  providers: [StatisticsService, StatisticsRepository],
})
export class StatisticsModule {}