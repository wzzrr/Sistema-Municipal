// src/usuarios/usuarios.service.ts

import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
import { CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto } from './dto/index.js';
import { Usuario } from './interfaces/usuario.interface.js';

@Injectable()
export class UsuariosService {
  constructor(@Inject('PG') private readonly db: Pool) {}

  /**
   * Hash de contraseña usando el mismo método que auth/users.service.ts
   */
  private hashPassword(password: string): string {
    const salt = process.env.PWD_SALT || 'sv';
    return crypto.createHash('sha256').update(salt + password).digest('hex');
  }

  /**
   * Mapper: row DB -> Usuario (sin password_hash)
   */
  private mapRowToUsuario(row: any): Usuario {
    return {
      id: row.id,
      email: row.email,
      nombre: row.nombre,
      rol: row.rol,
      activo: row.activo,
      creado_en: row.creado_en,
      actualizado_en: row.actualizado_en,
    };
  }

  /**
   * Obtener todos los usuarios (con filtros opcionales)
   */
  async findAll(filters?: { rol?: string; activo?: boolean }): Promise<Usuario[]> {
    let query = 'SELECT id, email, nombre, rol, activo, creado_en, actualizado_en FROM usuarios WHERE 1=1';
    const params: any[] = [];

    if (filters?.rol) {
      params.push(filters.rol);
      query += ` AND rol = $${params.length}`;
    }

    if (filters?.activo !== undefined) {
      params.push(filters.activo);
      query += ` AND activo = $${params.length}`;
    }

    query += ' ORDER BY creado_en DESC';

    const { rows } = await this.db.query(query, params);
    return rows.map(row => this.mapRowToUsuario(row));
  }

  /**
   * Obtener usuario por ID
   */
  async findById(id: number): Promise<Usuario> {
    const { rows } = await this.db.query(
      'SELECT id, email, nombre, rol, activo, creado_en, actualizado_en FROM usuarios WHERE id = $1',
      [id],
    );

    if (rows.length === 0) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return this.mapRowToUsuario(rows[0]);
  }

  /**
   * Obtener usuario por email
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.db.query(
      'SELECT id, email, nombre, rol, activo, creado_en, actualizado_en FROM usuarios WHERE email = $1',
      [email],
    );

    return rows.length > 0 ? this.mapRowToUsuario(rows[0]) : null;
  }

  /**
   * Crear nuevo usuario
   */
  async create(dto: CreateUsuarioDto): Promise<Usuario> {
    // Verificar que email no exista
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`El email ${dto.email} ya está registrado`);
    }

    const passwordHash = this.hashPassword(dto.password);
    const activo = dto.activo !== undefined ? dto.activo : true;

    const { rows } = await this.db.query(
      `INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, nombre, rol, activo, creado_en, actualizado_en`,
      [dto.email, passwordHash, dto.nombre || null, dto.rol, activo],
    );

    return this.mapRowToUsuario(rows[0]);
  }

  /**
   * Actualizar usuario (sin cambiar contraseña)
   */
  async update(id: number, dto: UpdateUsuarioDto): Promise<Usuario> {
    // Verificar que usuario existe
    await this.findById(id);

    // Si se cambia email, verificar que no exista
    if (dto.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException(`El email ${dto.email} ya está registrado`);
      }
    }

    const fields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      params.push(dto.email);
    }

    if (dto.nombre !== undefined) {
      fields.push(`nombre = $${paramIndex++}`);
      params.push(dto.nombre);
    }

    if (dto.rol !== undefined) {
      fields.push(`rol = $${paramIndex++}`);
      params.push(dto.rol);
    }

    if (dto.activo !== undefined) {
      fields.push(`activo = $${paramIndex++}`);
      params.push(dto.activo);
    }

    if (fields.length === 0) {
      return this.findById(id); // No hay cambios
    }

    params.push(id); // Último parámetro es el ID

    const query = `
      UPDATE usuarios
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, nombre, rol, activo, creado_en, actualizado_en
    `;

    const { rows } = await this.db.query(query, params);
    return this.mapRowToUsuario(rows[0]);
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    // Verificar que usuario existe
    await this.findById(id);

    const passwordHash = this.hashPassword(dto.newPassword);

    await this.db.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [passwordHash, id],
    );
  }

  /**
   * Eliminar usuario (soft delete: activo = false)
   */
  async remove(id: number): Promise<void> {
    // Verificar que usuario existe
    await this.findById(id);

    await this.db.query(
      'UPDATE usuarios SET activo = false WHERE id = $1',
      [id],
    );
  }

  /**
   * Eliminar usuario permanentemente (hard delete - solo para dev/testing)
   */
  async hardDelete(id: number): Promise<void> {
    // Verificar que usuario existe
    await this.findById(id);

    await this.db.query('DELETE FROM usuarios WHERE id = $1', [id]);
  }
}
