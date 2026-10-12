import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { RegisterDto } from './register.dto.js';

export class RegisterAdminDto extends RegisterDto {
  @ApiProperty({ example: 'NETSHIELD-ADMIN-2026' })
  @IsString()
  codigo_invitacion: string | undefined;
}
