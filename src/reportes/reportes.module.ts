import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { EvidenceController } from './evidence.controller.js';
import { ReportesController } from './reportes.controller.js';
import { ReportesRepository } from './reportes.repository.js';
import { ReportesService } from './reportes.service.js';
import { AdminReportesController } from './admin-reportes.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportesController, EvidenceController, AdminReportesController],
  providers: [ReportesService, ReportesRepository],
})
export class ReportesModule {}