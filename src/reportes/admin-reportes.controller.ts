import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { ReportesService } from './reportes.service.js';
import { ListReportesQueryDto } from './dto/list-reportes-query.dto.js';
import { ReporteResponseDto } from './dto/reporte-response.dto.js';
import { UpdateEstadoDto } from './dto/update-estado.dto.js';

@ApiTags('admin / reports')
@ApiBearerAuth()
@ApiResponse({ status: 403, description: 'Solo un administrador puede hacer esto' })
@Controller('admin/reports')
@UseGuards(AuthGuard, AdminGuard)
export class AdminReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar todos los reportes (filtra por estado o categoría)' })
  @ApiResponse({ status: 200, type: [ReporteResponseDto] })
  findAll(@Query() query: ListReportesQueryDto) {
    return this.service.listarTodos({
      estado: query.estado,
      idCategoria: query.id_categoria ? Number(query.id_categoria) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de cualquier reporte' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  @ApiResponse({ status: 404 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Aprobar, rechazar o regresar a pendiente un reporte' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cambiarEstado(id, user.sub, dto.estado!);
  }
}