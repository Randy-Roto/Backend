import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../auth/users.repository.js';
import type { FiltroUsuarios } from '../auth/users.repository.js';
import { borrarArchivo } from '../common/upload.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

/** Perfil propio y administración de cuentas. Nunca regresa `passwordHash`. */
@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getProfile(id: number): Promise<UserResponseDto> {
    const usuario = await this.users.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return UserResponseDto.fromEntity(usuario);
  }

  /** @throws ConflictException si el correo nuevo ya es de otra cuenta. */
  async updateProfile(id: number, dto: UpdateProfileDto): Promise<UserResponseDto> {
    if (dto.correo) {
      const otro = await this.users.findByCorreo(dto.correo);
      if (otro && otro.id_usuario !== id) {
        throw new ConflictException('Ese correo ya está registrado');
      }
    }
    await this.users.updateProfile(id, { nombre: dto.nombre, correo: dto.correo });
    return this.getProfile(id);
  }

  /**
   * Cambia la contraseña. Ojo: los JWT ya emitidos siguen siendo válidos hasta
   * que expiren (el servidor no guarda tokens), así que un refreshToken viejo
   * todavía renueva sesión hasta sus 7 días.
   * @throws BadRequestException si la contraseña actual no coincide.
   */
  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const usuario = await this.users.findById(id);
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);
    if (!(await bcrypt.compare(dto.password_actual!, usuario.passwordHash!))) {
      // 400 y no 401: un 401 haría que el cliente intente renovar el token.
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    if (dto.password_actual === dto.password_nueva) {
      throw new BadRequestException('La contraseña nueva debe ser distinta a la actual');
    }
    await this.users.updatePassword(id, await bcrypt.hash(dto.password_nueva!, 10));
  }

  /** Guarda la foto nueva y borra la anterior del disco. */
  async updatePhoto(id: number, file: Express.Multer.File): Promise<UserResponseDto> {
    const ruta = '/uploads/' + file.filename;
    const usuario = await this.users.findById(id);
    if (!usuario) {
      await borrarArchivo(ruta);
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }
    await this.users.updateFoto(id, ruta);
    await borrarArchivo(usuario.foto_perfil);
    return this.getProfile(id);
  }

  // ---- Lo que usa el panel de admin (Paso 38) ----

  async listar(filtro: FiltroUsuarios): Promise<UserResponseDto[]> {
    const usuarios = await this.users.findAll(filtro);
    return usuarios.map(UserResponseDto.fromEntity);
  }

  /** Perfil + cuántos reportes ha hecho, por estado. */
  async detalle(id: number) {
    const perfil = await this.getProfile(id);
    return { ...perfil, reportes: await this.users.resumenReportes(id) };
  }

  /** @throws BadRequestException si un admin intenta desactivar su propia cuenta. */
  async cambiarEstado(id: number, idAdmin: number, activo: boolean): Promise<UserResponseDto> {
    if (id === idAdmin && !activo) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }
    await this.getProfile(id); // 404 si no existe
    await this.users.setActivo(id, activo);
    return this.getProfile(id);
  }
}