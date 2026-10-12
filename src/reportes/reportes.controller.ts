import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { imageUpload } from '../common/upload.js';
import { ReportesService } from './reportes.service.js';
import { CreateReporteDto } from './dto/create-reporte.dto.js';
import { UpdateReporteDto } from './dto/update-reporte.dto.js';
import { EvidenciaDto, ReporteResponseDto } from './dto/reporte-response.dto.js';

@ApiTags('reports')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Falta el token, es inválido o expiró' })
@Controller('reports')
@UseGuards(AuthGuard)
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un reporte de fraude' })
  @ApiResponse({ status: 201, type: ReporteResponseDto })
  @ApiResponse({ status: 400, description: 'Categoría inexistente o desactivada' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReporteDto) {
    return this.service.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Consultar mis reportes' })
  @ApiResponse({ status: 200, type: [ReporteResponseDto] })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar un reporte específico' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  @ApiResponse({ status: 403, description: 'No eres el dueño ni un admin' })
  @ApiResponse({ status: 404 })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modificar mi reporte (solo si está pendiente)' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  @ApiResponse({ status: 409, description: 'El reporte ya fue revisado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReporteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar un reporte' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'No eres el dueño ni un admin' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user);
  }

  @Post(':id/evidence')
  @UseInterceptors(FileInterceptor('evidence', imageUpload))
  //@UseInterceptors(FileInterceptor('evidence', imageUpload as any))
  @ApiOperation({ summary: 'Subir una imagen de evidencia' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { evidence: { type: 'string', format: 'binary' } },
      required: ['evidence'],
    },
  })
  @ApiResponse({ status: 201, type: ReporteResponseDto })
  @ApiResponse({ status: 400, description: 'No vino archivo, no es imagen o pesa más de 5 MB' })
  uploadEvidence(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ): Promise<ReporteResponseDto> {
    if (!file) throw new BadRequestException('Falta el campo evidence');
    return this.service.agregarEvidencia(id, file, user);
  }

  @Get(':id/evidence')
  @ApiOperation({ summary: 'Consultar las evidencias de un reporte' })
  @ApiResponse({ status: 200, type: [EvidenciaDto] })
  listEvidence(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.listarEvidencias(id, user);
  }
}