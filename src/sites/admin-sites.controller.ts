import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { SitesService } from './sites.service.js';

@ApiTags('admin / sites')
@ApiBearerAuth()
@Controller('admin/sites')
@UseGuards(AuthGuard, AdminGuard)
export class AdminSitesController {
  constructor(private readonly service: SitesService) {}

  @Get(':id/history')
  @ApiOperation({ summary: 'Historial de reportes de un sitio' })
  history(@Param('id', ParseIntPipe) id: number) {
    return this.service.historial(id);
  }
}