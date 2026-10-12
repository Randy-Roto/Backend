import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'secreto123' })
  @IsString()
  password_actual: string | undefined;

  @ApiProperty({ example: 'otroSecreto456', minLength: 8 })
  @IsString()
  @MinLength(8)
  password_nueva: string | undefined;
}