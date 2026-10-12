export class Usuario {
  id_usuario: number | undefined;
  nombre: string | undefined;
  correo: string | undefined;
  passwordHash: string | undefined;
  id_rol: number | undefined;
  nombre_rol: 'usuario' | 'admin' | undefined;
  activo: boolean | undefined;
  fecha_registro: Date | undefined;
  foto_perfil: string | null | undefined;
}