import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module.js';
import { buildSet } from '../common/sql.js';
import { Categoria } from './entities/categoria.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findAll(soloActivas: boolean): Promise<Categoria[]> {
    const where = soloActivas ? 'WHERE activo = TRUE' : '';
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM categoria ${where} ORDER BY nombre`,
    );
    return rows.map(toEntity);
  }

  async findById(id: number): Promise<Categoria | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM categoria WHERE id_categoria = ?`,
      [id],
    );
    return rows[0] && toEntity(rows[0]);
  }

  async create(dto: CreateCategoryDto): Promise<Categoria> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        `INSERT INTO categoria (nombre, descripcion) VALUES (?, ?)`,
        [dto.nombre, dto.descripcion ?? null],
      );
      return (await this.findById(result.insertId))!;
    } catch (err: any) {
      throw traducir(err);
    }
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Categoria | undefined> {
    const { sql, params } = buildSet({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: dto.activo,
    });
    try {
      if (sql) {
        await this.pool.query(`UPDATE categoria SET ${sql} WHERE id_categoria = ?`, [...params, id]);
      }
    } catch (err: any) {
      throw traducir(err);
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        `DELETE FROM categoria WHERE id_categoria = ?`,
        [id],
      );
      return result.affectedRows > 0;
    } catch (err: any) {
      throw traducir(err);
    }
  }
}

/** Convierte errores crudos de MySQL en 409 legibles. */
function traducir(err: any): Error {
  if (err.code === 'ER_DUP_ENTRY') {
    return new ConflictException('Ya existe una categoría con ese nombre');
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return new ConflictException(
      'La categoría ya tiene reportes; en vez de borrarla, desactívala con PATCH (activo: false)',
    );
  }
  return err;
}

function toEntity(row: any): Categoria {
  const c = new Categoria();
  c.id_categoria = row.id_categoria;
  c.nombre = row.nombre;
  c.descripcion = row.descripcion;
  c.activo = !!row.activo;
  return c;
}