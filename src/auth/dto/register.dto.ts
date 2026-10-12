import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ana López' })
  @IsString()
  @MinLength(3)
  nombre: string | undefined;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail()
  correo: string | undefined;

  @ApiProperty({ example: 'secreto123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string | undefined;
}