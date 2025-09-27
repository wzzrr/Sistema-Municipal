import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseCameraTxt } from './parse-camera-txt.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';

@Injectable()
export class InfraccionesService {
  constructor(@Inject('PG') private readonly db: Pool) {}

  // === EXTRACT: sólo TXT, sin OCR ===
  async extract(body: { imageFileId?: string; txtFileId?: string }) {
    let ocr: any = {};
    let anpr: any = {};

    if (body.txtFileId) {
      const p = path.join(UPLOAD_DIR, body.txtFileId);
      try {
        const content = await fs.readFile(p, 'utf8');
        const parsed = parseCameraTxt(content);
        ocr = { ...parsed };
      } catch {
        // no-op
      }
    }

    const archivos = [
      ...(body.imageFileId
        ? [{ tipo: 'imagen', fileId: body.imageFileId, url: `s3://sv/${body.imageFileId}` }]
        : []),
      ...(body.txtFileId
        ? [{ tipo: 'txt', fileId: body.txtFileId, url: `s3://sv/${body.txtFileId}` }]
        : []),
    ];

    return { ocr, anpr, archivos };
  }

  // === CREATE: guarda foto_file_id, cam_serie y datos de vehículo ===
  async create(dto: any) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const serie = 'A';
      const up = await client.query(
        'UPDATE correlativos SET ultimo=ultimo+1 WHERE serie=$1 RETURNING ultimo',
        [serie],
      );
      const n = up.rows[0]?.ultimo ?? 1;

      const vMed = Number(dto.velocidad_medida) || 0;
      const vAut =
        dto.velocidad_autorizada !== undefined
          ? Number(dto.velocidad_autorizada) || 0
          : 0;

      const ins = await client.query(
        `INSERT INTO infracciones(
           serie, nro_correlativo, dominio, tipo_infraccion, fecha_labrado,
           velocidad_medida, velocidad_autorizada, ubicacion_texto, lat, lng,
           foto_file_id, cam_serie, tipo_vehiculo, vehiculo_marca, vehiculo_modelo, estado
         )
         VALUES(
           $1,$2,$3,'Exceso de velocidad',$4,
           $5,$6,$7,$8,$9,
           $10,$11,$12,$13,$14,'validada'
         )
         RETURNING id, serie, nro_correlativo,
           to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS fecha_carga`,
        [
          serie, n,
          dto.dominio, dto.fecha_labrado,
          vMed, vAut,
          dto.ubicacion_texto || null,
          dto.lat ?? null, dto.lng ?? null,
          dto.foto_file_id || null,
          dto.cam_serie || null,
          dto.tipo_vehiculo || null,
          dto.vehiculo_marca || null,
          dto.vehiculo_modelo || null,
        ],
      );

      const row = ins.rows[0];
      await client.query('COMMIT');

      const nro_acta = `${row.serie}-${String(row.nro_correlativo).padStart(7, '0')}`;
      return {
        id: row.id,
        nro_acta,
        fecha_carga: row.fecha_carga,
        ...dto,
        velocidad_medida: vMed,
        velocidad_autorizada: vAut,
        tipo_infraccion: 'Exceso de velocidad',
        estado: 'validada',
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async list(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    const push = (cl: string, v: any) => {
      params.push(v);
      where.push(cl.replace('$X', `$${params.length}`));
    };
    if (q.dominio) push('i.dominio=$X', q.dominio.toUpperCase());
    if (q.acta) push('i.nro_acta=$X', q.acta);
    if (q.estado) push('i.estado=$X', q.estado);

    const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // Intentamos vista
    try {
      const rows = await this.db.query(
        `SELECT id, nro_acta, dominio, fecha_labrado, fecha_carga,
                velocidad_medida, velocidad_autorizada, estado
           FROM infracciones_view ${sqlWhere}
          ORDER BY fecha_labrado DESC
          LIMIT 200`,
        params,
      );
      return {
        page: 1,
        pageSize: rows.rows.length,
        total: rows.rows.length,
        items: rows.rows,
      };
    } catch {
      // Fallback sin vista: construimos un WHERE manual con alias i.
      let whereSql = '';
      if (where.length) {
        // reemplazamos "i." por "i." en cada cláusula para asegurarlo,
        // aunque ya lo armamos con i. arriba. Evitamos replaceAll.
        whereSql =
          'WHERE ' +
          where
            .map((cl) => cl.replace(/^i\./, 'i.')) // por si acaso
            .join(' AND ');
      }

      const rows = await this.db.query(
        `SELECT
           i.id,
           (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta,
           i.dominio, i.fecha_labrado,
           to_char(now() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS"Z"') AS fecha_carga,
           i.velocidad_medida, i.velocidad_autorizada, i.estado
         FROM infracciones i
         ${whereSql}
         ORDER BY i.fecha_labrado DESC
         LIMIT 200`,
        params,
      );
      return {
        page: 1,
        pageSize: rows.rows.length,
        total: rows.rows.length,
        items: rows.rows,
      };
    }
  }

  async getOne(id: number) {
    try {
      const r = await this.db.query('SELECT * FROM infracciones_view WHERE id=$1', [id]);
      return r.rows[0];
    } catch {
      const r = await this.db.query(
        `SELECT
           i.*,
           (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta
         FROM infracciones i
         WHERE i.id=$1`,
        [id],
      );
      return r.rows[0];
    }
  }

  async patch(id: number, dto: any) {
    const sets: string[] = [];
    const params: any[] = [];
    const push = (s: string, v: any) => {
      params.push(v);
      sets.push(s.replace('$X', `$${params.length}`));
    };

    if (dto.ubicacion_texto !== undefined) push('ubicacion_texto=$X', dto.ubicacion_texto);
    if (dto.velocidad_medida !== undefined) push('velocidad_medida=$X', Number(dto.velocidad_medida) || 0);
    if (dto.velocidad_autorizada !== undefined) push('velocidad_autorizada=$X', Number(dto.velocidad_autorizada) || 0);
    if (dto.estado !== undefined) push('estado=$X', dto.estado);
    if (dto.cam_serie !== undefined) push('cam_serie=$X', dto.cam_serie);
    if (dto.tipo_vehiculo !== undefined) push('tipo_vehiculo=$X', dto.tipo_vehiculo);
    if (dto.vehiculo_marca !== undefined) push('vehiculo_marca=$X', dto.vehiculo_marca);
    if (dto.vehiculo_modelo !== undefined) push('vehiculo_modelo=$X', dto.vehiculo_modelo);

    if (!sets.length) return { ok: true };
    await this.db.query(
      `UPDATE infracciones SET ${sets.join(', ')} WHERE id=$${params.length + 1}`,
      [...params, id],
    );
    return { ok: true };
  }
}
