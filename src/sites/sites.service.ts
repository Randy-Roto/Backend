import { Injectable, NotFoundException } from '@nestjs/common';
import { SitesRepository } from './sites.repository.js';

/** Consulta de sitios reportados. Solo lectura. */
@Injectable()
export class SitesService {
  constructor(private readonly repository: SitesRepository) {}

  async buscar(url: string) {
    const encontrado = await this.repository.buscarPorUrl(url);
    return (
      encontrado ?? {
        id_sitio: null,
        url,
        reportado: false,
        total_reportes: 0,
        reportes_aprobados: 0,
        categorias: [],
        fecha_primer_reporte: null,
      }
    );
  }

  /** @throws NotFoundException si el sitio no existe. */
  async historial(idSitio: number) {
    const sitio = await this.repository.findSitio(idSitio);
    if (!sitio) throw new NotFoundException(`Sitio ${idSitio} no encontrado`);
    return { sitio, reportes: await this.repository.historial(idSitio) };
  }
}