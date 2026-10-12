import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';
import { ROL } from '../common/constants.js';
import { UsersRepository } from './users.repository.js';
import { sign, verify } from './jwt.js';

const ACCESS_TTL = 60 * 15; // 15 minutos
const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 días

// Igual que SECRET en jwt.ts: escrito en el código por ahora.
// Compártelo solo con quien deba poder crear administradores.
const ADMIN_INVITE_CODE = 'NETSHIELD-ADMIN-2026';

/**
 * Registro, login y renovación de tokens, tanto de usuarios como de admins.
 * Una cuenta con `activo = false` no puede entrar ni renovar tokens.
 */
@Injectable()
export class AuthService {
  constructor(private readonly users: UsersRepository) {}

  async register(nombre: string, correo: string, password: string) {
    return this.crearCuenta(nombre, correo, password, ROL.USUARIO);
  }

  /** @throws ForbiddenException si el código de invitación no coincide. */
  async registerAdmin(nombre: string, correo: string, password: string, codigo: string) {
    if (!codigoValido(codigo)) {
      throw new ForbiddenException('Código de invitación inválido');
    }
    return this.crearCuenta(nombre, correo, password, ROL.ADMIN);
  }

  async login(correo: string, password: string) {
    const usuario = await this.autenticar(correo, password, false);
    return this.emitirTokens(usuario.id_usuario!, usuario.nombre_rol!);
  }

  /** Mismo flujo que `login`, pero rechaza cuentas que no son `admin`. */
  async loginAdmin(correo: string, password: string) {
    const usuario = await this.autenticar(correo, password, true);
    return this.emitirTokens(usuario.id_usuario!, usuario.nombre_rol!);
  }

  async refresh(refreshToken: string) {
    const payload = verify(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    // Se vuelve a leer al usuario: si lo desactivaron o cambió de rol, se nota aquí.
    const usuario = await this.users.findById(payload.sub);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Cuenta no disponible');
    }
    return {
      accessToken: sign(
        { sub: usuario.id_usuario!, rol: usuario.nombre_rol!, type: 'access' },
        ACCESS_TTL,
      ),
    };
  }

  private async crearCuenta(
    nombre: string,
    correo: string,
    password: string,
    rol: 'usuario' | 'admin',
  ) {
    if (await this.users.findByCorreo(correo)) {
      throw new ConflictException('Ese correo ya está registrado');
    }
    const hash = await bcrypt.hash(password, 10);
    const usuario = await this.users.create(nombre, correo, hash, rol);
    return { id_usuario: usuario.id_usuario, correo: usuario.correo, rol: usuario.nombre_rol };
  }

  private async autenticar(correo: string, password: string, soloAdmin: boolean) {
    const usuario = await this.users.findByCorreo(correo);
    if (
      !usuario ||
      (soloAdmin && usuario.nombre_rol !== ROL.ADMIN) ||
      !(await bcrypt.compare(password, usuario.passwordHash!))
    ) {
      // Mismo mensaje para "no existe", "no es admin" y "password mal":
      // no le decimos a un atacante cuál de las tres fue.
      throw new UnauthorizedException('Correo o contraseña inválidos');
    }
    if (!usuario.activo) {
      throw new ForbiddenException('Tu cuenta está desactivada');
    }
    return usuario;
  }

  private emitirTokens(sub: number, rol: 'usuario' | 'admin') {
    return {
      accessToken: sign({ sub, rol, type: 'access' }, ACCESS_TTL),
      refreshToken: sign({ sub, rol, type: 'refresh' }, REFRESH_TTL),
    };
  }
}

function codigoValido(recibido: string): boolean {
  const a = Buffer.from(recibido);
  const b = Buffer.from(ADMIN_INVITE_CODE);
  // timingSafeEqual exige mismo largo; comparar en tiempo constante evita
  // que se adivine el código midiendo cuánto tarda en responder.
  return a.length === b.length && timingSafeEqual(a, b);
}