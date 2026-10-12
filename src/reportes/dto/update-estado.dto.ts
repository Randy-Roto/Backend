import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ESTADOS_VALIDOS } from '../../common/constants.js';

export class UpdateEstadoDto {
  @ApiProperty({ enum: ESTADOS_VALIDOS, example: 'aprobado' })
  @IsIn(ESTADOS_VALIDOS)
  estado: string | undefined;
}