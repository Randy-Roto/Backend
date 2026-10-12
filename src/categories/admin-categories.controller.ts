import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@ApiTags('admin / categories')
@ApiBearerAuth()
@ApiResponse({ status: 403, description: 'Solo un administrador puede hacer esto' })
@Controller('admin/categories')
@UseGuards(AuthGuard, AdminGuard)
export class AdminCategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una categoría' })
  @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar o desactivar una categoría' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una categoría sin reportes' })
  @ApiResponse({ status: 409, description: 'Tiene reportes: desactívala en vez de borrarla' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}