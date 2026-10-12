import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Phishing Bancario' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string | undefined;

  @ApiPropertyOptional({ example: 'Suplantación de bancos' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}   