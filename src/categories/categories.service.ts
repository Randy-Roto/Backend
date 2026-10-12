import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Categoria } from './entities/categoria.entity.js';

/** Catálogo de categorías de fraude. Borrar una con reportes no se permite: se desactiva. */
@Injectable()
export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  findAll(soloActivas: boolean): Promise<Categoria[]> {
    return this.repository.findAll(soloActivas);
  }

  create(dto: CreateCategoryDto): Promise<Categoria> {
    return this.repository.create(dto);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Categoria> {
    const actualizada = await this.repository.update(id, dto);
    if (!actualizada) throw new NotFoundException(`Categoría ${id} no encontrada`);
    return actualizada;
  }

  async remove(id: number): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw new NotFoundException(`Categoría ${id} no encontrada`);
    }
  }
}