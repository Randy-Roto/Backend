import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: ['usuario', 'admin'] })
  @IsOptional()
  @IsIn(['usuario', 'admin'])
  rol?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  activo?: string;
}