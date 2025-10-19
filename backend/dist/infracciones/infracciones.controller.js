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
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { InfraccionesService } from './infracciones.service.js';
import { CreateInfraccionDto } from './dto/create-infraccion.dto.js';
let InfraccionesController = class InfraccionesController {
    constructor(service) {
        this.service = service;
    }
    async extract(body) {
        return this.service.extract(body);
    }
    async create(dto) {
        return this.service.create(dto);
    }
    async list(q) {
        return this.service.list(q);
    }
    async getOne(id) {
        return this.service.getOne(Number(id));
    }
    async patch(id, dto) {
        return this.service.patch(Number(id), dto);
    }
};
__decorate([
    Post('extract'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InfraccionesController.prototype, "extract", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateInfraccionDto]),
    __metadata("design:returntype", Promise)
], InfraccionesController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InfraccionesController.prototype, "list", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InfraccionesController.prototype, "getOne", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InfraccionesController.prototype, "patch", null);
InfraccionesController = __decorate([
    Controller('infracciones'),
    __metadata("design:paramtypes", [InfraccionesService])
], InfraccionesController);
export { InfraccionesController };
