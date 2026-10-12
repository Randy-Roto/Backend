import { ApiProperty } from '@nestjs/swagger';
import { EvidenciaItem, Reporte } from '../entities/reporte.entity.js';

export class EvidenciaDto {
  @ApiProperty() id_evidencia: number | undefined;
  @ApiProperty({ example: '/uploads/3f2c9a7e-1b2d.png' }) ruta_imagen: string | undefined;
  @ApiProperty() fecha_subida: string | undefined;

  static fromItem(e: EvidenciaItem): EvidenciaDto {
    const dto = new EvidenciaDto();
    dto.id_evidencia = e.id_evidencia;
    dto.ruta_imagen = e.ruta_imagen;
    dto.fecha_subida = new Date(e.fecha_subida).toISOString();
    return dto;
  }
}

export class ReporteResponseDto {
  @ApiProperty() id_reporte: number | undefined;
  @ApiProperty() id_usuario: number | undefined;
  @ApiProperty() id_sitio: number | undefined;
  @ApiProperty({ example: 'https://falso-banco.com/login' }) url: string | undefined;
  @ApiProperty() id_categoria: number | undefined;
  @ApiProperty({ example: 'Phishing Bancario' }) categoria: string | undefined;
  @ApiProperty({ example: 'pendiente' }) estado: string | undefined;
  @ApiProperty() descripcion: string | undefined;
  @ApiProperty() fecha_reporte: string | undefined;
  @ApiProperty({ type: Number, nullable: true }) id_admin_revisor: number | null | undefined;
  @ApiProperty({ type: String, nullable: true }) fecha_revision: string | null | undefined;
  @ApiProperty({ type: [EvidenciaDto] }) evidencias: EvidenciaDto[] = [];

  static fromEntity(r: Reporte): ReporteResponseDto {
    const dto = new ReporteResponseDto();
    dto.id_reporte = r.id_reporte;
    dto.id_usuario = r.id_usuario;
    dto.id_sitio = r.id_sitio;
    dto.url = r.url;
    dto.id_categoria = r.id_categoria;
    dto.categoria = r.categoria;
    dto.estado = r.estado;
    dto.descripcion = r.descripcion;
    dto.fecha_reporte = r.fecha_reporte?.toISOString();
    dto.id_admin_revisor = r.id_admin_revisor;
    dto.fecha_revision = r.fecha_revision ? r.fecha_revision.toISOString() : null;
    dto.evidencias = r.evidencias.map(EvidenciaDto.fromItem);
    return dto;
  }
}