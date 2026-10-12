import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReporteDto {
  @ApiProperty({ example: 'https://falso-banco.com/login' })
  @IsUrl()
  @MaxLength(768) // sitio.url es VARCHAR(768), ver Paso 31
  url: string | undefined;

  @ApiProperty({ type: Number, example: 1, description: 'id de GET /categories' })
  @IsInt()
  @Min(1)
  id_categoria: number | undefined;

  @ApiProperty({ example: 'Me llegó un SMS pidiendo mi NIP para "desbloquear" mi cuenta.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descripcion: string | undefined;
}