import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('admin / notifications')
@ApiBearerAuth()
@ApiResponse({ status: 403, description: 'Solo un administrador puede hacer esto' })
@Controller('admin/notifications')
@UseGuards(AuthGuard, AdminGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar mis notificaciones' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListNotificationsQueryDto) {
    return this.service.listar(user.sub, query.estado);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @ApiResponse({ status: 404, description: 'No existe o es de otro administrador' })
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.marcarLeida(id, user.sub);
  }
}
