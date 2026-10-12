import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { TrendsQueryDto } from './dto/trends-query.dto.js';
import { StatisticsService } from './statistics.service.js';

@ApiTags('admin / statistics')
@ApiBearerAuth()
@ApiResponse({ status: 403, description: 'Solo un administrador puede hacer esto' })
@Controller('admin/dashboard')
@UseGuards(AuthGuard, AdminGuard)
export class DashboardController {
  constructor(private readonly service: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Resumen del panel: totales, recientes y notificaciones sin leer' })
  dashboard(@CurrentUser() user: JwtPayload) {
    return this.service.dashboard(user.sub);
  }
}

@ApiTags('admin / statistics')
@ApiBearerAuth()
@ApiResponse({ status: 403, description: 'Solo un administrador puede hacer esto' })
@Controller('admin/statistics')
@UseGuards(AuthGuard, AdminGuard)
export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: 'Estadísticas generales de fraudes' })
  general() {
    return this.service.general();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Reportes por categoría' })
  categories() {
    return this.service.porCategoria();
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Reportes pendientes, aprobados y rechazados' })
  statuses() {
    return this.service.porEstado();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Tendencia de reportes por día, semana o mes' })
  trends(@Query() query: TrendsQueryDto) {
    return this.service.tendencias(query);
  }
}