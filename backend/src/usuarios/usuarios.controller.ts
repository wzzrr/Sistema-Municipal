// src/usuarios/usuarios.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto } from './dto/index.js';
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * GET /api/usuarios - Listar todos los usuarios
   * Acceso: dev, admin
   */
  @Get()
  @Roles('dev', 'admin')
  async findAll(@Query('rol') rol?: string, @Query('activo') activo?: string) {
    const filters: any = {};

    if (rol) filters.rol = rol;
    if (activo !== undefined) filters.activo = activo === 'true';

    const usuarios = await this.usuariosService.findAll(filters);
    return { usuarios };
  }

  /**
   * GET /api/usuarios/:id - Obtener usuario por ID
   * Acceso: dev, admin, o el propio usuario
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const currentUser = (req as any).user;

    // Verificar permisos: admin/dev pueden ver cualquiera, usuarios normales solo su propio perfil
    if (!['dev', 'admin'].includes(currentUser.rol) && currentUser.id !== id) {
      throw new ForbiddenException('No tienes permisos para ver este usuario');
    }

    const usuario = await this.usuariosService.findById(id);
    return { usuario };
  }

  /**
   * POST /api/usuarios - Crear nuevo usuario
   * Acceso: dev, admin
   */
  @Post()
  @Roles('dev', 'admin')
  async create(@Body() dto: CreateUsuarioDto) {
    const usuario = await this.usuariosService.create(dto);
    return { usuario, message: 'Usuario creado exitosamente' };
  }

  /**
   * PATCH /api/usuarios/:id - Actualizar usuario
   * Acceso: dev, admin, o el propio usuario (con restricciones)
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: Request,
  ) {
    const currentUser = (req as any).user;

    // Verificar permisos
    const isAdminOrDev = ['dev', 'admin'].includes(currentUser.rol);
    const isOwnProfile = currentUser.id === id;

    if (!isAdminOrDev && !isOwnProfile) {
      throw new ForbiddenException('No tienes permisos para actualizar este usuario');
    }

    // Si no es admin/dev, no puede cambiar rol ni activo
    if (!isAdminOrDev) {
      if (dto.rol !== undefined || dto.activo !== undefined) {
        throw new ForbiddenException('No puedes cambiar tu rol o estado de activación');
      }
    }

    const usuario = await this.usuariosService.update(id, dto);
    return { usuario, message: 'Usuario actualizado exitosamente' };
  }

  /**
   * POST /api/usuarios/:id/change-password - Cambiar contraseña
   * Acceso: dev, admin, o el propio usuario
   */
  @Post(':id/change-password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const currentUser = (req as any).user;

    // Verificar permisos
    const isAdminOrDev = ['dev', 'admin'].includes(currentUser.rol);
    const isOwnProfile = currentUser.id === id;

    if (!isAdminOrDev && !isOwnProfile) {
      throw new ForbiddenException('No tienes permisos para cambiar esta contraseña');
    }

    await this.usuariosService.changePassword(id, dto);
    return { message: 'Contraseña actualizada exitosamente' };
  }

  /**
   * DELETE /api/usuarios/:id - Desactivar usuario (soft delete)
   * Acceso: dev, admin
   */
  @Delete(':id')
  @Roles('dev', 'admin')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const currentUser = (req as any).user;

    // Evitar que un usuario se desactive a sí mismo
    if (currentUser.id === id) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta');
    }

    await this.usuariosService.remove(id);
    return { message: 'Usuario desactivado exitosamente' };
  }
}
