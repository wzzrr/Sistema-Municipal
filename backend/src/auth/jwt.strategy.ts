import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express'; // <-- agrega esto

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // SOLO cookie httpOnly
        (req: Request) => (req && (req as any).cookies ? (req as any).cookies['sv_token'] : null), // <-- tipado
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }
  async validate(payload: any) { return payload; }
}
