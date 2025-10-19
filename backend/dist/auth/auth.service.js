var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service.js';
let AuthService = class AuthService {
    constructor(jwt, users) {
        this.jwt = jwt;
        this.users = users;
    }
    async validateUser(email, password) {
        const u = await this.users.findByEmail(email);
        if (!u || !u.activo)
            throw new UnauthorizedException('Usuario inválido');
        const hash = this.users.hashPassword(password);
        if (hash !== u.password_hash)
            throw new UnauthorizedException('Credenciales inválidas');
        return { id: u.id, email: u.email, rol: u.rol };
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        const token = await this.jwt.signAsync(user);
        return { token, user };
    }
};
AuthService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [JwtService, UsersService])
], AuthService);
export { AuthService };
