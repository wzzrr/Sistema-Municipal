import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class TitularesService {
  constructor(@Inject('PG') private readonly db: Pool) {}

  async byDominio(dominio: string) {
    const r = await this.db.query(
      'SELECT dominio, nombre, dni, domicilio, tipo_vehiculo, marca, modelo, cp, departamento, provincia FROM titulares WHERE dominio=$1',
      [dominio.toUpperCase()],
    );
    if (!r.rows[0]) throw new NotFoundException('Dominio no encontrado');
    return r.rows[0];
  }
}
