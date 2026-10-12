import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional } from 'class-validator';
import { ESTADOS_VALIDOS } from '../../common/constants.js';

export class ListReportesQueryDto {
  @ApiPropertyOptional({ enum: ESTADOS_VALIDOS })
  @IsOptional()
  @IsIn(ESTADOS_VALIDOS)
  estado?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  id_categoria?: string;
}