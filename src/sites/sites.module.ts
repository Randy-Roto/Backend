import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminSitesController } from './admin-sites.controller.js';
import { SitesController } from './sites.controller.js';
import { SitesRepository } from './sites.repository.js';
import { SitesService } from './sites.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SitesController, AdminSitesController],
  providers: [SitesService, SitesRepository],
})
export class SitesModule {}