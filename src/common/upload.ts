import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { diskStorage } from 'multer';

// Sin .svg a propósito: un SVG puede traer scripts.
const EXTENSIONES = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// Firma que espera NestJS (MulterOptions): siempre dos argumentos.
type FileFilterCb = (error: Error | null, acceptFile: boolean) => void;

export const imageUpload = {
  storage: diskStorage({
    destination: 'uploads',
    // UUID: no se pisan archivos y el nombre no se puede adivinar.
    filename: (_req, file, cb) =>
      cb(null, randomUUID() + extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  // El mimetype lo manda el cliente, así que solo es un primer filtro.
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: FileFilterCb) => {
    const ok =
      file.mimetype.startsWith('image/') &&
      EXTENSIONES.has(extname(file.originalname).toLowerCase());
    if (!ok) {
      return cb(new BadRequestException('Solo se aceptan imágenes .png, .jpg o .webp'), false);
    }
    cb(null, true);
  },
};

/** Borra un archivo de `uploads/` dado su ruta pública (`/uploads/x.png`). No falla si ya no existe. */
export async function borrarArchivo(ruta: string | null | undefined): Promise<void> {
  if (!ruta) return;
  await unlink(join(process.cwd(), ruta)).catch(() => undefined);
}