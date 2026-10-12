import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export const PERIODOS = ['dia', 'semana', 'mes'] as const;

export class TrendsQueryDto {
  @ApiPropertyOptional({ enum: PERIODOS, default: 'mes' })
  @IsOptional()
  @IsIn(PERIODOS)
  periodo?: (typeof PERIODOS)[number];

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Por defecto: hace 12 meses' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Por defecto: hoy' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}