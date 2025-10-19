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
import { Body, Controller, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { InternalGuard } from '../common/internal.guard.js';
let NotificacionesController = class NotificacionesController {
    constructor(svc) {
        this.svc = svc;
    }
    generar(id) {
        return this.svc.generarPdf(Number(id));
    }
    async generarStream(id, res) {
        const { bytes, filename } = await this.svc.generarPdfStream(Number(id));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(Buffer.from(bytes));
    }
    enviar(id, body) {
        return this.svc.enviar(Number(id), body.email);
    }
};
__decorate([
    UseGuards(JwtAuthGuard, RolesGuard),
    Post(':infraccionId/pdf'),
    HttpCode(201),
    Roles('operador', 'admin'),
    __param(0, Param('infraccionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificacionesController.prototype, "generar", null);
__decorate([
    UseGuards(JwtAuthGuard, RolesGuard),
    Post(':infraccionId/pdf/stream'),
    HttpCode(200),
    Roles('operador', 'admin'),
    __param(0, Param('infraccionId')),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificacionesController.prototype, "generarStream", null);
__decorate([
    UseGuards(JwtAuthGuard, RolesGuard),
    Post(':id/enviar'),
    Roles('operador', 'admin'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificacionesController.prototype, "enviar", null);
NotificacionesController = __decorate([
    Controller('notificaciones'),
    __metadata("design:paramtypes", [NotificacionesService])
], NotificacionesController);
export { NotificacionesController };
let NotificacionesInternalController = class NotificacionesInternalController {
    constructor(svc) {
        this.svc = svc;
    }
    generarInternal(id) {
        return this.svc.generarPdf(Number(id));
    }
};
__decorate([
    Post(':infraccionId/pdf'),
    HttpCode(201),
    __param(0, Param('infraccionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NotificacionesInternalController.prototype, "generarInternal", null);
NotificacionesInternalController = __decorate([
    UseGuards(InternalGuard),
    Controller('internal/notificaciones'),
    __metadata("design:paramtypes", [NotificacionesService])
], NotificacionesInternalController);
export { NotificacionesInternalController };
