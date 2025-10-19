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
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';
let UsersService = class UsersService {
    constructor(db) {
        this.db = db;
    }
    async findByEmail(email) {
        const { rows } = await this.db.query('SELECT id, email, rol, password_hash, activo FROM usuarios WHERE email=$1', [email]);
        return rows[0] || null;
    }
    hashPassword(password) {
        const salt = process.env.PWD_SALT || 'sv';
        return crypto.createHash('sha256').update(salt + password).digest('hex');
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, Inject('PG')),
    __metadata("design:paramtypes", [Pool])
], UsersService);
export { UsersService };
