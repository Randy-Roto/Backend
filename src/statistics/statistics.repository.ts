import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module.js';
import { NOTIFICACION, ROL } from '../common/constants.js';

// Formatos de DATE_FORMAT por periodo. %x-W%v = año y semana ISO (lunes a domingo).
const FORMATOS = { dia: '%Y-%m-%d', semana: '%x-W%v', mes: '%Y-%m' } as const;

@Injectable()
export class StatisticsRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async general() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM reporte) AS total_reportes,
              (SELECT COUNT(*) FROM sitio) AS total_sitios,
              (SELECT COUNT(*) FROM (
                  SELECT id_sitio FROM reporte GROUP BY id_sitio HAVING COUNT(*) > 1
               ) multi) AS sitios_reincidentes,
              (SELECT COUNT(DISTINCT id_usuario) FROM reporte) AS usuarios_reportantes`,
    );
    const row = rows[0]!;
    return {
      total_reportes: Number(row.total_reportes),
      total_sitios: Number(row.total_sitios),
      sitios_reincidentes: Number(row.sitios_reincidentes),
      usuarios_reportantes: Number(row.usuarios_reportantes),
    };
  }

  async topSitios(limite: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.id_sitio, s.url, COUNT(r.id_reporte) AS total
       FROM sitio s
       JOIN reporte r ON r.id_sitio = s.id_sitio
       GROUP BY s.id_sitio, s.url
       ORDER BY total DESC
       LIMIT ?`,
      [limite],
    );
    return rows.map((r) => ({ id_sitio: r.id_sitio, url: r.url, total: Number(r.total) }));
  }

  /** Incluye categorías con 0 reportes (LEFT JOIN). */
  async porCategoria() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.id_categoria, c.nombre, COUNT(r.id_reporte) AS total
       FROM categoria c
       LEFT JOIN reporte r ON r.id_categoria = c.id_categoria
       GROUP BY c.id_categoria, c.nombre
       ORDER BY total DESC, c.nombre`,
    );
    return rows.map((r) => ({
      id_categoria: r.id_categoria,
      nombre: r.nombre,
      total: Number(r.total),
    }));
  }

  /** Incluye estados con 0 reportes (LEFT JOIN). */
  async porEstado() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT e.nombre_estado AS estado, COUNT(r.id_reporte) AS total
       FROM estado_reporte e
       LEFT JOIN reporte r ON r.id_estado_reporte = e.id_estado_reporte
       GROUP BY e.id_estado_reporte, e.nombre_estado`,
    );
    return rows.map((r) => ({ estado: r.estado as string, total: Number(r.total) }));
  }

  async tendencias(periodo: keyof typeof FORMATOS, desde: Date, hasta: Date) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(fecha_reporte, ?) AS periodo, COUNT(*) AS total
       FROM reporte
       WHERE fecha_reporte BETWEEN ? AND ?
       GROUP BY periodo
       ORDER BY periodo`,
      [FORMATOS[periodo], desde, hasta],
    );
    return rows.map((r) => ({ periodo: r.periodo as string, total: Number(r.total) }));
  }

  // ---- Piezas del dashboard ----

  async reportesUltimosDias(dias: number): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM reporte WHERE fecha_reporte >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [dias],
    );
    return Number(rows[0]!.total);
  }

  async usuarios() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(u.activo), 0) AS activos
       FROM usuario u
       JOIN rol r ON r.id_rol = u.id_rol
       WHERE r.nombre_rol = ?`,
      [ROL.USUARIO],
    );
    return { total: Number(rows[0]!.total), activos: Number(rows[0]!.activos) };
  }

  async notificacionesSinLeer(idAdmin: number): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM notificacion n
       JOIN estado_notificacion en ON en.id_estado_notificacion = n.id_estado_notificacion
       WHERE n.id_administrador = ? AND en.nombre_estado = ?`,
      [idAdmin, NOTIFICACION.NO_LEIDA],
    );
    return Number(rows[0]!.total);
  }

  async recientes(limite: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.id_reporte, s.url, c.nombre AS categoria,
              e.nombre_estado AS estado, r.fecha_reporte
       FROM reporte r
       JOIN sitio s ON s.id_sitio = r.id_sitio
       JOIN categoria c ON c.id_categoria = r.id_categoria
       JOIN estado_reporte e ON e.id_estado_reporte = r.id_estado_reporte
       ORDER BY r.fecha_reporte DESC
       LIMIT ?`,
      [limite],
    );
    return rows;
  }
}