import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository.js';

/** Bandeja de notificaciones de cada administrador. */
@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  listar(idAdmin: number, estado?: string) {
    return this.repository.findByAdmin(idAdmin, estado);
  }

  /** Es idempotente: marcar como leída una ya leída no falla. */
  async marcarLeida(id: number, idAdmin: number) {
    if (!(await this.repository.findOneByAdmin(id, idAdmin))) {
      throw new NotFoundException(`Notificación ${id} no encontrada`);
    }
    await this.repository.marcarLeida(id, idAdmin);
    return this.repository.findOneByAdmin(id, idAdmin);
  }
}