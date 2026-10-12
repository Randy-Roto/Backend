import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module.js';
import { NOTIFICACION } from '../common/constants.js';

const SELECT_NOTIFICACION = `
  SELECT n.id_notificacion, n.id_reporte, en.nombre_estado AS estado, n.fecha_envio,
         s.url, c.nombre AS categoria, u.nombre AS reportado_por
  FROM notificacion n
  JOIN estado_notificacion en ON en.id_estado_notificacion = n.id_estado_notificacion
  JOIN reporte r ON r.id_reporte = n.id_reporte
  JOIN sitio s ON s.id_sitio = r.id_sitio
  JOIN categoria c ON c.id_categoria = r.id_categoria
  JOIN usuario u ON u.id_usuario = r.id_usuario`;

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findByAdmin(idAdmin: number, estado?: string) {
    const extra = estado ? 'AND en.nombre_estado = ?' : '';
    const params = estado ? [idAdmin, estado] : [idAdmin];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_NOTIFICACION} WHERE n.id_administrador = ? ${extra} ORDER BY n.fecha_envio DESC`,
      params,
    );
    return rows;
  }

  async findOneByAdmin(id: number, idAdmin: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT_NOTIFICACION} WHERE n.id_notificacion = ? AND n.id_administrador = ?`,
      [id, idAdmin],
    );
    return rows[0];
  }

  async marcarLeida(id: number, idAdmin: number): Promise<void> {
    await this.pool.query(
      `UPDATE notificacion
       SET id_estado_notificacion =
             (SELECT id_estado_notificacion FROM estado_notificacion WHERE nombre_estado = ?)
       WHERE id_notificacion = ? AND id_administrador = ?`,
      [NOTIFICACION.LEIDA, id, idAdmin],
    );
  }
}