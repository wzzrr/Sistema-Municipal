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
import { Body, Controller, Post } from '@nestjs/common';
import dayjs from 'dayjs';
import { ActasPresencialesService } from './actas-presenciales.service.js';
let ActasPresencialesController = class ActasPresencialesController {
    constructor(service) {
        this.service = service;
    }
    async generarTicket(payload) {
        const fecha = payload.fechaActa ? dayjs(payload.fechaActa).toDate() : new Date();
        const result = await this.service.saveTicket({
            ...payload,
            fechaActa: fecha,
        });
        return {
            ok: true,
            message: 'Ticket generado correctamente',
            file: result.filename,
            path: result.pdf_path,
        };
    }
};
__decorate([
    Post('ticket'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActasPresencialesController.prototype, "generarTicket", null);
ActasPresencialesController = __decorate([
    Controller('presencial'),
    __metadata("design:paramtypes", [ActasPresencialesService])
], ActasPresencialesController);
export { ActasPresencialesController };
