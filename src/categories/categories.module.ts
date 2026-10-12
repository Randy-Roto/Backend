import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminCategoriesController } from './admin-categories.controller.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CategoriesService, CategoriesRepository],
})
export class CategoriesModule {}