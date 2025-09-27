import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service.js';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private users: UsersService) {}
  async validateUser(email: string, password: string) {
    const u = await this.users.findByEmail(email);
    if (!u || !u.activo) throw new UnauthorizedException('Usuario inválido');
    const hash = this.users.hashPassword(password);
    if (hash !== u.password_hash) throw new UnauthorizedException('Credenciales inválidas');
    return { id: u.id, email: u.email, rol: u.rol };
  }
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const token = await this.jwt.signAsync(user);
    return { token, user };
  }
}
