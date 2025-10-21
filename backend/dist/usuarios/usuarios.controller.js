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
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException, ParseIntPipe, } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto, UpdateUsuarioDto, ChangePasswordDto } from './dto/index.js';
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
let UsuariosController = class UsuariosController {
    constructor(usuariosService) {
        this.usuariosService = usuariosService;
    }
    async findAll(rol, activo) {
        const filters = {};
        if (rol)
            filters.rol = rol;
        if (activo !== undefined)
            filters.activo = activo === 'true';
        const usuarios = await this.usuariosService.findAll(filters);
        return { usuarios };
    }
    async findOne(id, req) {
        const currentUser = req.user;
        if (!['dev', 'admin'].includes(currentUser.rol) && currentUser.id !== id) {
            throw new ForbiddenException('No tienes permisos para ver este usuario');
        }
        const usuario = await this.usuariosService.findById(id);
        return { usuario };
    }
    async create(dto) {
        const usuario = await this.usuariosService.create(dto);
        return { usuario, message: 'Usuario creado exitosamente' };
    }
    async update(id, dto, req) {
        const currentUser = req.user;
        const isAdminOrDev = ['dev', 'admin'].includes(currentUser.rol);
        const isOwnProfile = currentUser.id === id;
        if (!isAdminOrDev && !isOwnProfile) {
            throw new ForbiddenException('No tienes permisos para actualizar este usuario');
        }
        if (!isAdminOrDev) {
            if (dto.rol !== undefined || dto.activo !== undefined) {
                throw new ForbiddenException('No puedes cambiar tu rol o estado de activación');
            }
        }
        const usuario = await this.usuariosService.update(id, dto);
        return { usuario, message: 'Usuario actualizado exitosamente' };
    }
    async changePassword(id, dto, req) {
        const currentUser = req.user;
        const isAdminOrDev = ['dev', 'admin'].includes(currentUser.rol);
        const isOwnProfile = currentUser.id === id;
        if (!isAdminOrDev && !isOwnProfile) {
            throw new ForbiddenException('No tienes permisos para cambiar esta contraseña');
        }
        await this.usuariosService.changePassword(id, dto);
        return { message: 'Contraseña actualizada exitosamente' };
    }
    async remove(id, req) {
        const currentUser = req.user;
        if (currentUser.id === id) {
            throw new ForbiddenException('No puedes desactivar tu propia cuenta');
        }
        await this.usuariosService.remove(id);
        return { message: 'Usuario desactivado exitosamente' };
    }
};
__decorate([
    Get(),
    Roles('dev', 'admin'),
    __param(0, Query('rol')),
    __param(1, Query('activo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsuariosController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsuariosController.prototype, "findOne", null);
__decorate([
    Post(),
    Roles('dev', 'admin'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateUsuarioDto]),
    __metadata("design:returntype", Promise)
], UsuariosController.prototype, "create", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateUsuarioDto, Object]),
    __metadata("design:returntype", Promise)
], UsuariosController.prototype, "update", null);
__decorate([
    Post(':id/change-password'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ChangePasswordDto, Object]),
    __metadata("design:returntype", Promise)
], UsuariosController.prototype, "changePassword", null);
__decorate([
    Delete(':id'),
    Roles('dev', 'admin'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsuariosController.prototype, "remove", null);
UsuariosController = __decorate([
    Controller('usuarios'),
    UseGuards(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [UsuariosService])
], UsuariosController);
export { UsuariosController };
