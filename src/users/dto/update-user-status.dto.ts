import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ type: Boolean, example: false, description: 'true = activa, false = desactiva' })
  @IsBoolean()
  activo: boolean | undefined;
}