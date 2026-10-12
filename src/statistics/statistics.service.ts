import { Injectable } from '@nestjs/common';
import { ESTADO } from '../common/constants.js';
import { StatisticsRepository } from './statistics.repository.js';
import type { TrendsQueryDto } from './dto/trends-query.dto.js';

/** Números agregados para el panel de administración. Solo lectura. */
@Injectable()
export class StatisticsService {
  constructor(private readonly repository: StatisticsRepository) {}

  /** `{ pendientes, aprobados, rechazados, total }`; siempre trae las tres claves. */
  async porEstado() {
    const filas = await this.repository.porEstado();
    const cuenta = (estado: string) => filas.find((f) => f.estado === estado)?.total ?? 0;
    const pendientes = cuenta(ESTADO.PENDIENTE);
    const aprobados = cuenta(ESTADO.APROBADO);
    const rechazados = cuenta(ESTADO.RECHAZADO);
    return { pendientes, aprobados, rechazados, total: pendientes + aprobados + rechazados };
  }

  async general() {
    const [base, estados, topSitios] = await Promise.all([
      this.repository.general(),
      this.porEstado(),
      this.repository.topSitios(5),
    ]);
    const revisados = estados.aprobados + estados.rechazados;
    return {
      ...base,
      // de los reportes ya revisados, qué porcentaje se aprobó (null si aún no hay ninguno)
      tasa_aprobacion: revisados ? Math.round((estados.aprobados / revisados) * 10000) / 100 : null,
      top_sitios: topSitios,
    };
  }

  porCategoria() {
    return this.repository.porCategoria();
  }

  tendencias(query: TrendsQueryDto) {
    const hasta = query.hasta ? new Date(query.hasta) : new Date();
    const desde = query.desde
      ? new Date(query.desde)
      : new Date(hasta.getTime() - 365 * 24 * 60 * 60 * 1000);
    return this.repository.tendencias(query.periodo ?? 'mes', desde, hasta);
  }

  async dashboard(idAdmin: number) {
    const [reportes, ultimos7, usuarios, sinLeer, recientes] = await Promise.all([
      this.porEstado(),
      this.repository.reportesUltimosDias(7),
      this.repository.usuarios(),
      this.repository.notificacionesSinLeer(idAdmin),
      this.repository.recientes(5),
    ]);
    return {
      reportes,
      reportes_ultimos_7_dias: ultimos7,
      usuarios,
      notificaciones_sin_leer: sinLeer,
      recientes,
    };
  }
}