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
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TitularesService } from './titulares.service.js';
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
let TitularesController = class TitularesController {
    constructor(svc) {
        this.svc = svc;
    }
    async byDominio(dominio) {
        return this.svc.byDominio(dominio);
    }
};
__decorate([
    Get(':dominio'),
    Roles('dev', 'admin', 'agente'),
    __param(0, Param('dominio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TitularesController.prototype, "byDominio", null);
TitularesController = __decorate([
    Controller('titulares'),
    UseGuards(JwtAuthGuard, RolesGuard),
    __metadata("design:paramtypes", [TitularesService])
], TitularesController);
export { TitularesController };
