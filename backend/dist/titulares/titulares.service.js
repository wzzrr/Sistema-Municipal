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
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
let TitularesService = class TitularesService {
    constructor(db) {
        this.db = db;
    }
    async byDominio(dominio) {
        const r = await this.db.query('SELECT dominio, nombre, dni, domicilio FROM titulares WHERE dominio=$1', [dominio.toUpperCase()]);
        if (!r.rows[0])
            throw new NotFoundException('Dominio no encontrado');
        return r.rows[0];
    }
};
TitularesService = __decorate([
    Injectable(),
    __param(0, Inject('PG')),
    __metadata("design:paramtypes", [Pool])
], TitularesService);
export { TitularesService };
