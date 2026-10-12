import { Inject, Injectable } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module.js';
import { buildSet } from '../common/sql.js';
import { ESTADO, ROL } from '../common/constants.js';
import { Usuario } from './entities/usuario.entity.js';

const SELECT_USUARIO = `
  SELECT u.id_usuario, u.nombre, u.correo, u.password_hash, u.id_rol,
         r.nombre_rol, u.activo, u.fecha_registro, u.foto_perfil
  FROM usuario u
  JOIN rol r ON r.id_rol = u.id_rol`;

export interface FiltroUsuarios {
  activo?: boolean;
  rol?: string;
}

@Injectable()
export class UsersRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findByCorreo(correo: string): Promise<Usuario | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_USUARIO} WHERE u.correo = ?`,
      [correo],
    );
    return rows[0] && toEntity(rows[0]);
  }

  async findById(id: number): Promise<Usuario | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_USUARIO} WHERE u.id_usuario = ?`,
      [id],
    );
    return rows[0] && toEntity(rows[0]);
  }

  async findAll(filtro: FiltroUsuarios): Promise<Usuario[]> {
    const condiciones: string[] = [];
    const params: unknown[] = [];
    if (filtro.activo !== undefined) {
      condiciones.push('u.activo = ?');
      params.push(filtro.activo);
    }
    if (filtro.rol) {
      condiciones.push('r.nombre_rol = ?');
      params.push(filtro.rol);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_USUARIO} ${where} ORDER BY u.fecha_registro DESC`,
      params,
    );
    return rows.map(toEntity);
  }

  async create(
    nombre: string,
    correo: string,
    passwordHash: string,
    rol: 'usuario' | 'admin' = ROL.USUARIO,
  ): Promise<Usuario> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO usuario (nombre, correo, password_hash, id_rol)
       VALUES (?, ?, ?, (SELECT id_rol FROM rol WHERE nombre_rol = ?))`,
      [nombre, correo, passwordHash, rol],
    );
    return (await this.findById(result.insertId))!;
  }

  async updateProfile(id: number, campos: { nombre?: string; correo?: string }): Promise<void> {
    const { sql, params } = buildSet(campos);
    if (!sql) return;
    await this.pool.query(`UPDATE usuario SET ${sql} WHERE id_usuario = ?`, [...params, id]);
  }

  async updateFoto(id: number, ruta: string): Promise<void> {
    await this.pool.query(`UPDATE usuario SET foto_perfil = ? WHERE id_usuario = ?`, [ruta, id]);
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    await this.pool.query(`UPDATE usuario SET password_hash = ? WHERE id_usuario = ?`, [
      passwordHash,
      id,
    ]);
  }

  async setActivo(id: number, activo: boolean): Promise<void> {
    await this.pool.query(`UPDATE usuario SET activo = ? WHERE id_usuario = ?`, [activo, id]);
  }

  /** Conteo de los reportes de un usuario por estado (para el detalle de admin). */
  async resumenReportes(id: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(r.id_reporte) AS total,
              COALESCE(SUM(e.nombre_estado = ?), 0) AS pendientes,
              COALESCE(SUM(e.nombre_estado = ?), 0) AS aprobados,
              COALESCE(SUM(e.nombre_estado = ?), 0) AS rechazados
       FROM reporte r
       JOIN estado_reporte e ON e.id_estado_reporte = r.id_estado_reporte
       WHERE r.id_usuario = ?`,
      [ESTADO.PENDIENTE, ESTADO.APROBADO, ESTADO.RECHAZADO, id],
    );
    const row = rows[0]!;
    return {
      total: Number(row.total),
      pendientes: Number(row.pendientes),
      aprobados: Number(row.aprobados),
      rechazados: Number(row.rechazados),
    };
  }
}

function toEntity(row: any): Usuario {
  const u = new Usuario();
  u.id_usuario = row.id_usuario;
  u.nombre = row.nombre;
  u.correo = row.correo;
  u.passwordHash = row.password_hash;
  u.id_rol = row.id_rol;
  u.nombre_rol = row.nombre_rol;
  u.activo = !!row.activo;
  u.fecha_registro = row.fecha_registro;
  u.foto_perfil = row.foto_perfil;
  return u;
}