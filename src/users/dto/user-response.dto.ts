import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../auth/entities/usuario.entity.js';

export class UserResponseDto {
  @ApiProperty() id_usuario: number | undefined;
  @ApiProperty() nombre: string | undefined;
  @ApiProperty() correo: string | undefined;
  @ApiProperty({ example: 'usuario' }) rol: string | undefined;
  @ApiProperty() activo: boolean | undefined;
  @ApiProperty() fecha_registro: string | undefined;
  @ApiProperty({ type: String, nullable: true, example: '/uploads/3f2c9a7e.png' })
  foto_perfil: string | null | undefined;

  static fromEntity(u: Usuario): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id_usuario = u.id_usuario;
    dto.nombre = u.nombre;
    dto.correo = u.correo;
    dto.rol = u.nombre_rol;
    dto.activo = u.activo;
    dto.fecha_registro = u.fecha_registro?.toISOString();
    dto.foto_perfil = u.foto_perfil ?? null;
    return dto;
  }
}