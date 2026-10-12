import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto.js';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({ type: Boolean, description: 'false = ya no aparece al reportar' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}