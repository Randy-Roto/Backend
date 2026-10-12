import {ConflictException, ForbiddenException, Injectable, NotFoundException,} from '@nestjs/common';
import { ESTADO, ROL } from '../common/constants.js';
import { borrarArchivo } from '../common/upload.js';
import { JwtPayload } from '../auth/jwt.js';
import { FiltroReportes, ReportesRepository } from './reportes.repository.js';
import { CreateReporteDto } from './dto/create-reporte.dto.js';
import { UpdateReporteDto } from './dto/update-reporte.dto.js';
import { EvidenciaDto, ReporteResponseDto } from './dto/reporte-response.dto.js';
import { Reporte } from './entities/reporte.entity.js';

/**
 * Reglas de negocio de los reportes de fraude.
 *
 * No sabe de HTTP ni de SQL. Los permisos (dueño vs. admin) se revisan aquí,
 * no en el controller.
 */
@Injectable()
export class ReportesService {
  constructor(private readonly repository: ReportesRepository) {}

  async create(idUsuario: number, dto: CreateReporteDto): Promise<ReporteResponseDto> {
    return ReporteResponseDto.fromEntity(await this.repository.create(idUsuario, dto));
  }

  /** Solo los reportes del propio usuario (también para un admin: su vista global es /admin/reports). */
  async findAll(user: JwtPayload): Promise<ReporteResponseDto[]> {
    const reportes = await this.repository.findAll({ idUsuario: user.sub });
    return reportes.map(ReporteResponseDto.fromEntity);
  }

  /**
   * @throws NotFoundException si no existe el reporte.
   * @throws ForbiddenException si quien pide no es el dueño ni un admin.
   */
  async findOne(id: number, user: JwtPayload): Promise<ReporteResponseDto> {
    return ReporteResponseDto.fromEntity(await this.cargarConPermiso(id, user, 'ver'));
  }

  /**
   * Edita descripción o categoría.
   * @throws ForbiddenException si quien pide no es el dueño.
   * @throws ConflictException si el reporte ya no está pendiente.
   */
  async update(id: number, dto: UpdateReporteDto, user: JwtPayload): Promise<ReporteResponseDto> {
    const reporte = await this.cargarConPermiso(id, user, 'modificar');
    if (reporte.id_usuario !== user.sub) {
      throw new ForbiddenException('Solo el dueño puede modificar su reporte');
    }
    if (reporte.estado !== ESTADO.PENDIENTE) {
      throw new ConflictException('Solo se pueden modificar reportes pendientes');
    }
    return ReporteResponseDto.fromEntity((await this.repository.update(id, dto))!);
  }

  /** @throws ForbiddenException si quien pide no es el dueño ni un admin. */
  async remove(id: number, user: JwtPayload): Promise<void> {
    const reporte = await this.cargarConPermiso(id, user, 'borrar');
    await this.repository.delete(id);
    // La base ya borró las filas de evidencia; faltan los archivos.
    await Promise.all(reporte.evidencias.map((e) => borrarArchivo(e.ruta_imagen)));
  }

  /**
   * Asocia al reporte un archivo que Multer ya dejó en `uploads/`.
   * Si el permiso falla, el archivo se borra para no dejar basura en disco.
   */
  async agregarEvidencia(
    id: number,
    file: Express.Multer.File,
    user: JwtPayload,
  ): Promise<ReporteResponseDto> {
    const ruta = '/uploads/' + file.filename;
    try {
      await this.cargarConPermiso(id, user, 'agregar evidencia a');
    } catch (err) {
      await borrarArchivo(ruta);
      throw err;
    }
    await this.repository.agregarEvidencia(id, ruta);
    return ReporteResponseDto.fromEntity((await this.repository.findById(id))!);
  }

  async listarEvidencias(id: number, user: JwtPayload): Promise<EvidenciaDto[]> {
    const reporte = await this.cargarConPermiso(id, user, 'ver la evidencia de');
    return reporte.evidencias.map(EvidenciaDto.fromItem);
  }

  /** @throws NotFoundException si no existe; ForbiddenException si no es el dueño ni admin. */
  async eliminarEvidencia(idEvidencia: number, user: JwtPayload): Promise<void> {
    const ev = await this.repository.findEvidenciaById(idEvidencia);
    if (!ev) throw new NotFoundException(`Evidencia ${idEvidencia} no encontrada`);
    if (user.rol !== ROL.ADMIN && ev.id_usuario !== user.sub) {
      throw new ForbiddenException('No puedes borrar evidencia de otro usuario');
    }
    await this.repository.deleteEvidencia(idEvidencia);
    await borrarArchivo(ev.ruta_imagen);
  }

  // ---- Lo que usa el panel de admin (Paso 39) ----

  async listarTodos(filtro: FiltroReportes): Promise<ReporteResponseDto[]> {
    const reportes = await this.repository.findAll(filtro);
    return reportes.map(ReporteResponseDto.fromEntity);
  }

  async detalle(id: number): Promise<ReporteResponseDto> {
    const reporte = await this.repository.findById(id);
    if (!reporte) throw new NotFoundException(`Reporte ${id} no encontrado`);
    return ReporteResponseDto.fromEntity(reporte);
  }

  /** Aprueba, rechaza o regresa a pendiente; deja registrado qué admin y cuándo. */
  async cambiarEstado(id: number, idAdmin: number, estado: string): Promise<ReporteResponseDto> {
    await this.detalle(id); // 404 si no existe
    return ReporteResponseDto.fromEntity((await this.repository.cambiarEstado(id, idAdmin, estado))!);
  }

  private async cargarConPermiso(id: number, user: JwtPayload, accion: string): Promise<Reporte> {
    const reporte = await this.repository.findById(id);
    if (!reporte) throw new NotFoundException(`Reporte ${id} no encontrado`);
    if (user.rol !== ROL.ADMIN && reporte.id_usuario !== user.sub) {
      throw new ForbiddenException(`No puedes ${accion} reportes de otro usuario`);
    }
    return reporte;
  }
}