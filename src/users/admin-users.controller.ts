import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { JwtPayload } from '../auth/jwt.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('admin / users')
@ApiBearerAuth()
@ApiResponse({ status: 403, description: 'Solo un administrador puede hacer esto' })
@Controller('admin/users')
@UseGuards(AuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Consultar usuarios registrados (filtros opcionales)' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.service.listar({
      rol: query.rol,
      activo: query.activo === undefined ? undefined : query.activo === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un usuario, con el resumen de sus reportes' })
  @ApiResponse({ status: 404 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activar o desactivar una cuenta' })
  @ApiResponse({ status: 400, description: 'No puedes desactivar tu propia cuenta' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.cambiarEstado(id, user.sub, dto.activo!);
  }
}