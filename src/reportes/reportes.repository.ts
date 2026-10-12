import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module.js';
import { buildSet } from '../common/sql.js';
import { ESTADO, NOTIFICACION, ROL } from '../common/constants.js';
import { Reporte } from './entities/reporte.entity.js';
import type { EvidenciaItem } from './entities/reporte.entity.js';
import { CreateReporteDto } from './dto/create-reporte.dto.js';
import { UpdateReporteDto } from './dto/update-reporte.dto.js';

const SELECT_REPORTE = `
  SELECT r.id_reporte, r.id_usuario, r.id_sitio, s.url,
         r.id_categoria, c.nombre AS categoria, e.nombre_estado AS estado,
         r.descripcion, r.fecha_reporte, r.id_admin_revisor, r.fecha_revision
  FROM reporte r
  JOIN sitio s ON s.id_sitio = r.id_sitio
  JOIN categoria c ON c.id_categoria = r.id_categoria
  JOIN estado_reporte e ON e.id_estado_reporte = r.id_estado_reporte`;

export interface FiltroReportes {
  idUsuario?: number;
  estado?: string;
  idCategoria?: number;
}

export interface EvidenciaConDueno {
  id_evidencia: number;
  id_reporte: number;
  ruta_imagen: string;
  id_usuario: number; // dueño del reporte
}

@Injectable()
export class ReportesRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async create(idUsuario: number, dto: CreateReporteDto): Promise<Reporte> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      const [cats] = await conn.query<RowDataPacket[]>(
        `SELECT id_categoria FROM categoria WHERE id_categoria = ? AND activo = TRUE`,
        [dto.id_categoria],
      );
      if (!cats[0]) throw new BadRequestException('La categoría no existe o está desactivada');

      const [sitio] = await conn.query<ResultSetHeader>(
        `INSERT INTO sitio (url) VALUES (?)
         ON DUPLICATE KEY UPDATE id_sitio = LAST_INSERT_ID(id_sitio)`,
        [dto.url],
      );
      const [reporte] = await conn.query<ResultSetHeader>(
        `INSERT INTO reporte (id_usuario, id_sitio, id_categoria, id_estado_reporte, descripcion)
         VALUES (?, ?, ?, (SELECT id_estado_reporte FROM estado_reporte WHERE nombre_estado = ?), ?)`,
        [idUsuario, sitio.insertId, dto.id_categoria, ESTADO.PENDIENTE, dto.descripcion],
      );

      // Aviso automático: una notificación "no_leida" por cada admin activo.
      await conn.query(
        `INSERT INTO notificacion (id_reporte, id_administrador, id_estado_notificacion)
         SELECT ?, u.id_usuario,
                (SELECT id_estado_notificacion FROM estado_notificacion WHERE nombre_estado = ?)
         FROM usuario u
         JOIN rol r ON r.id_rol = u.id_rol
         WHERE r.nombre_rol = ? AND u.activo = TRUE`,
        [reporte.insertId, NOTIFICACION.NO_LEIDA, ROL.ADMIN],
      );

      await conn.commit();
      return (await this.findById(reporte.insertId))!;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async findAll(filtro: FiltroReportes): Promise<Reporte[]> {
    const condiciones: string[] = [];
    const params: unknown[] = [];
    if (filtro.idUsuario) {
      condiciones.push('r.id_usuario = ?');
      params.push(filtro.idUsuario);
    }
    if (filtro.estado) {
      condiciones.push('e.nombre_estado = ?');
      params.push(filtro.estado);
    }
    if (filtro.idCategoria) {
      condiciones.push('r.id_categoria = ?');
      params.push(filtro.idCategoria);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_REPORTE} ${where} ORDER BY r.fecha_reporte DESC`,
      params,
    );
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async findById(id: number): Promise<Reporte | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_REPORTE} WHERE r.id_reporte = ?`,
      [id],
    );
    return rows[0] && (await this.hydrate(rows[0]));
  }

  async update(id: number, dto: UpdateReporteDto): Promise<Reporte | undefined> {
    if (dto.id_categoria !== undefined) {
      const [cats] = await this.pool.query<RowDataPacket[]>(
        `SELECT id_categoria FROM categoria WHERE id_categoria = ? AND activo = TRUE`,
        [dto.id_categoria],
      );
      if (!cats[0]) throw new BadRequestException('La categoría no existe o está desactivada');
    }
    const { sql, params } = buildSet({
      descripcion: dto.descripcion,
      id_categoria: dto.id_categoria,
    });
    if (sql) {
      await this.pool.query(`UPDATE reporte SET ${sql} WHERE id_reporte = ?`, [...params, id]);
    }
    return this.findById(id);
  }

  async cambiarEstado(id: number, idAdmin: number, estado: string): Promise<Reporte | undefined> {
    await this.pool.query(
      `UPDATE reporte
       SET id_estado_reporte = (SELECT id_estado_reporte FROM estado_reporte WHERE nombre_estado = ?),
           id_admin_revisor = ?, fecha_revision = NOW()
       WHERE id_reporte = ?`,
      [estado, idAdmin, id],
    );
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    // evidencia y notificacion se borran solas (ON DELETE CASCADE).
    const [result] = await this.pool.query<ResultSetHeader>(
      `DELETE FROM reporte WHERE id_reporte = ?`,
      [id],
    );
    return result.affectedRows > 0;
  }

  async agregarEvidencia(idReporte: number, ruta: string): Promise<void> {
    await this.pool.query(`INSERT INTO evidencia (id_reporte, ruta_imagen) VALUES (?, ?)`, [
      idReporte,
      ruta,
    ]);
  }

  async findEvidenciaById(id: number): Promise<EvidenciaConDueno | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ev.id_evidencia, ev.id_reporte, ev.ruta_imagen, r.id_usuario
       FROM evidencia ev
       JOIN reporte r ON r.id_reporte = ev.id_reporte
       WHERE ev.id_evidencia = ?`,
      [id],
    );
    const row = rows[0];
    return row && {
      id_evidencia: row.id_evidencia,
      id_reporte: row.id_reporte,
      ruta_imagen: row.ruta_imagen,
      id_usuario: row.id_usuario,
    };
  }

  async deleteEvidencia(id: number): Promise<void> {
    await this.pool.query(`DELETE FROM evidencia WHERE id_evidencia = ?`, [id]);
  }

  private async hydrate(row: any): Promise<Reporte> {
    const r = new Reporte();
    r.id_reporte = row.id_reporte;
    r.id_usuario = row.id_usuario;
    r.id_sitio = row.id_sitio;
    r.url = row.url;
    r.id_categoria = row.id_categoria;
    r.categoria = row.categoria;
    r.estado = row.estado;
    r.descripcion = row.descripcion;
    r.fecha_reporte = row.fecha_reporte;
    r.id_admin_revisor = row.id_admin_revisor;
    r.fecha_revision = row.fecha_revision;

    const [ev] = await this.pool.query<RowDataPacket[]>(
      `SELECT id_evidencia, ruta_imagen, fecha_subida
       FROM evidencia WHERE id_reporte = ? ORDER BY id_evidencia`,
      [row.id_reporte],
    );
    r.evidencias = ev.map(
      (e): EvidenciaItem => ({
        id_evidencia: e.id_evidencia,
        ruta_imagen: e.ruta_imagen,
        fecha_subida: e.fecha_subida,
      }),
    );
    return r;
  }
}