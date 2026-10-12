import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { ROL } from '../common/constants.js';
import { CategoriesService } from './categories.service.js';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Categorías disponibles (solo las activas)' })
  @ApiQuery({ name: 'todas', required: false, description: 'true = incluye inactivas (solo admin)' })
  findAll(@CurrentUser() user: JwtPayload, @Query('todas') todas?: string) {
    const verTodas = todas === 'true' && user.rol === ROL.ADMIN;
    return this.service.findAll(!verTodas);
  }
}