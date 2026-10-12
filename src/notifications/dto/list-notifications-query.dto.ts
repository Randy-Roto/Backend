import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { NOTIFICACIONES_VALIDAS } from '../../common/constants.js';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ enum: NOTIFICACIONES_VALIDAS, description: 'Omite el filtro para ver todas' })
  @IsOptional()
  @IsIn(NOTIFICACIONES_VALIDAS)
  estado?: string;
}