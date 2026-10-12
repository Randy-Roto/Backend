import { Controller, Delete, HttpCode, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { ReportesService } from './reportes.service.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('evidence')
@UseGuards(AuthGuard)
export class EvidenceController {
  constructor(private readonly service: ReportesService) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una evidencia' })
  @ApiResponse({ status: 403, description: 'La evidencia es de otro usuario' })
  @ApiResponse({ status: 404 })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.eliminarEvidencia(id, user);
  }
}