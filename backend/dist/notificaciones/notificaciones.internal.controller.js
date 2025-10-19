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
import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { InternalGuard } from '../common/internal.guard.js';
let NotificacionesInternalController = class NotificacionesInternalController {
    constructor(svc) {
        this.svc = svc;
    }
    generarInterno(id) {
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
], NotificacionesInternalController.prototype, "generarInterno", null);
NotificacionesInternalController = __decorate([
    UseGuards(InternalGuard),
    Controller('internal/notificaciones'),
    __metadata("design:paramtypes", [NotificacionesService])
], NotificacionesInternalController);
export { NotificacionesInternalController };
