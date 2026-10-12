import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateReporteDto } from './create-reporte.dto.js';

export class UpdateReporteDto extends PartialType(OmitType(CreateReporteDto, ['url'] as const)) {}