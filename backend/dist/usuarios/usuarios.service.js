var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
let UsuariosService = class UsuariosService {
    constructor(db) {
        this.db = db;
    }
    hashPassword(password) {
        const salt = process.env.PWD_SALT || 'sv';
        return crypto.createHash('sha256').update(salt + password).digest('hex');
    }
    mapRowToUsuario(row) {
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
    async findAll(filters) {
        let query = 'SELECT id, email, nombre, rol, activo, creado_en, actualizado_en FROM usuarios WHERE 1=1';
        const params = [];
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
    async findById(id) {
        const { rows } = await this.db.query('SELECT id, email, nombre, rol, activo, creado_en, actualizado_en FROM usuarios WHERE id = $1', [id]);
        if (rows.length === 0) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return this.mapRowToUsuario(rows[0]);
    }
    async findByEmail(email) {
        const { rows } = await this.db.query('SELECT id, email, nombre, rol, activo, creado_en, actualizado_en FROM usuarios WHERE email = $1', [email]);
        return rows.length > 0 ? this.mapRowToUsuario(rows[0]) : null;
    }
    async create(dto) {
        const existing = await this.findByEmail(dto.email);
        if (existing) {
            throw new ConflictException(`El email ${dto.email} ya está registrado`);
        }
        const passwordHash = this.hashPassword(dto.password);
        const activo = dto.activo !== undefined ? dto.activo : true;
        const { rows } = await this.db.query(`INSERT INTO usuarios (email, password_hash, nombre, rol, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, nombre, rol, activo, creado_en, actualizado_en`, [dto.email, passwordHash, dto.nombre || null, dto.rol, activo]);
        return this.mapRowToUsuario(rows[0]);
    }
    async update(id, dto) {
        await this.findById(id);
        if (dto.email) {
            const existing = await this.findByEmail(dto.email);
            if (existing && existing.id !== id) {
                throw new ConflictException(`El email ${dto.email} ya está registrado`);
            }
        }
        const fields = [];
        const params = [];
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
            return this.findById(id);
        }
        params.push(id);
        const query = `
      UPDATE usuarios
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, nombre, rol, activo, creado_en, actualizado_en
    `;
        const { rows } = await this.db.query(query, params);
        return this.mapRowToUsuario(rows[0]);
    }
    async changePassword(id, dto) {
        await this.findById(id);
        const passwordHash = this.hashPassword(dto.newPassword);
        await this.db.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
    }
    async remove(id) {
        await this.findById(id);
        await this.db.query('UPDATE usuarios SET activo = false WHERE id = $1', [id]);
    }
    async hardDelete(id) {
        await this.findById(id);
        await this.db.query('DELETE FROM usuarios WHERE id = $1', [id]);
    }
};
UsuariosService = __decorate([
    Injectable(),
    __param(0, Inject('PG')),
    __metadata("design:paramtypes", [Pool])
], UsuariosService);
export { UsuariosService };
