import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module.js';
import { ESTADO } from '../common/constants.js';

@Injectable()
export class SitesRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /** Resumen agregado de una URL, o `undefined` si nunca se ha reportado. */
  async buscarPorUrl(url: string) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.id_sitio, s.url, s.fecha_primer_reporte,
              COUNT(r.id_reporte) AS total_reportes,
              COALESCE(SUM(e.nombre_estado = ?), 0) AS reportes_aprobados,
              GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR '||') AS categorias
       FROM sitio s
       LEFT JOIN reporte r ON r.id_sitio = s.id_sitio
       LEFT JOIN estado_reporte e ON e.id_estado_reporte = r.id_estado_reporte
       LEFT JOIN categoria c ON c.id_categoria = r.id_categoria
       WHERE s.url = ?
       GROUP BY s.id_sitio, s.url, s.fecha_primer_reporte`,
      [ESTADO.APROBADO, url],
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id_sitio: row.id_sitio as number,
      url: row.url as string,
      reportado: Number(row.total_reportes) > 0,
      total_reportes: Number(row.total_reportes),
      reportes_aprobados: Number(row.reportes_aprobados),
      categorias: row.categorias ? (row.categorias as string).split('||') : [],
      fecha_primer_reporte: row.fecha_primer_reporte as Date,
    };
  }

  async findSitio(id: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id_sitio, url, fecha_primer_reporte FROM sitio WHERE id_sitio = ?`,
      [id],
    );
    return rows[0];
  }

  async historial(idSitio: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.id_reporte, r.id_usuario, u.nombre AS usuario,
              c.nombre AS categoria, e.nombre_estado AS estado,
              r.descripcion, r.fecha_reporte, r.fecha_revision
       FROM reporte r
       JOIN usuario u ON u.id_usuario = r.id_usuario
       JOIN categoria c ON c.id_categoria = r.id_categoria
       JOIN estado_reporte e ON e.id_estado_reporte = r.id_estado_reporte
       WHERE r.id_sitio = ?
       ORDER BY r.fecha_reporte DESC`,
      [idSitio],
    );
    return rows;
  }
}