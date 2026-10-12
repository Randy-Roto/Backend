export const ROL = { USUARIO: 'usuario', ADMIN: 'admin' } as const;

export const ESTADO = {
  PENDIENTE: 'pendiente',
  APROBADO: 'aprobado',
  RECHAZADO: 'rechazado',
} as const;
export const ESTADOS_VALIDOS: string[] = Object.values(ESTADO);

export const NOTIFICACION = { NO_LEIDA: 'no_leida', LEIDA: 'leida' } as const;
export const NOTIFICACIONES_VALIDAS: string[] = Object.values(NOTIFICACION);