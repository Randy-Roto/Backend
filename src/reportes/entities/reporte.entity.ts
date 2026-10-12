export interface EvidenciaItem {
  id_evidencia: number;
  ruta_imagen: string;
  fecha_subida: Date;
}

export class Reporte {
  id_reporte: number | undefined;
  id_usuario: number | undefined;
  id_sitio: number | undefined;
  url: string | undefined;
  id_categoria: number | undefined;
  categoria: string | undefined;
  estado: string | undefined;
  descripcion: string | undefined;
  fecha_reporte: Date | undefined;
  id_admin_revisor: number | null | undefined;
  fecha_revision: Date | null | undefined;
  evidencias: EvidenciaItem[] = [];
}