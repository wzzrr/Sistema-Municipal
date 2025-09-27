import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(@Inject('PG') private readonly db: Pool) {}

  async findByEmail(email: string) {
    const { rows } = await this.db.query(
      'SELECT id, email, rol, password_hash, activo FROM usuarios WHERE email=$1',
      [email],
    );
    return rows[0] || null;
  }

  hashPassword(password: string) {
    const salt = process.env.PWD_SALT || 'sv';
    // ***OJO***: si tu DB fue cargada con otro esquema (p. ej. password+salt),
    // deberías replicarlo acá. Esta versión usa sha256(salt + password).
    return crypto.createHash('sha256').update(salt + password).digest('hex');
  }
}
