import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseCameraTxt } from './parse-camera-txt.js';

// Import ESM con extensión .js
import { NotificacionesService } from '../notificaciones/notificaciones.service.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';

@Injectable()
export class InfraccionesService {
  constructor(
    @Inject('PG') private readonly db: Pool,
    @Optional() private readonly notifs?: NotificacionesService,
  ) {}

  private readonly log = new Logger('InfraccionesService');

  /** === OCR & lectura TXT de cámara === */
  async extract(body: { imageFileId?: string; txtFileId?: string }) {
    let ocr: any = {};
    let anpr: any = {};

    if (body.txtFileId) {
      const p = path.join(UPLOAD_DIR, body.txtFileId);
      try {
        const content = await fs.readFile(p, 'utf8');
        const parsed = parseCameraTxt(content);
        ocr = { ...parsed };
      } catch { /* noop */ }
    }

    const archivos = [
      ...(body.imageFileId ? [{ tipo: 'imagen', fileId: body.imageFileId, url: `s3://sv/${body.imageFileId}` }] : []),
      ...(body.txtFileId   ? [{ tipo: 'txt',    fileId: body.txtFileId,   url: `s3://sv/${body.txtFileId}` }]   : []),
    ];

    return { ocr, anpr, archivos };
  }

  /** === Crear nueva infracción === */
  async create(dto: any) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      // ⚙️ Ahora no generamos manualmente el correlativo: lo hace el trigger
      const serie = 'A'; // podría venir dinámico más adelante

      const vMed = Number(dto.velocidad_medida) || 0;
      const vAut = dto.velocidad_autorizada !== undefined ? Number(dto.velocidad_autorizada) || 0 : 0;

      // ✅ Inserta sin nro_correlativo → el trigger asigna automáticamente
      const ins = await client.query(
        `INSERT INTO infracciones(
           serie, dominio, tipo_infraccion, fecha_labrado,
           velocidad_medida, velocidad_autorizada, ubicacion_texto, lat, lng,
           foto_file_id, cam_serie, tipo_vehiculo, vehiculo_marca, vehiculo_modelo,
           emision_texto, arteria, estado
         )
         VALUES(
           $1, $2, 'Exceso de velocidad', $3,
           $4, $5, $6, $7, $8,
           $9, $10, $11, $12, $13,
           $14, $15, 'validada'
         )
         RETURNING id`,
        [
          serie,
          dto.dominio, dto.fecha_labrado,
          vMed, vAut,
          dto.ubicacion_texto || null,
          dto.lat ?? null, dto.lng ?? null,
          dto.foto_file_id || null,
          dto.cam_serie || null,
          dto.tipo_vehiculo || null,
          dto.vehiculo_marca || null,
          dto.vehiculo_modelo || null,
          dto.emision_texto ?? null,
          dto.arteria ?? null,
        ],
      );

      const row = ins.rows[0];
      await client.query('COMMIT');

      // ⚙️ Reconsultar la vista para traer nro_acta ya formateado
      const res = await this.db.query(
        `SELECT id, nro_acta, fecha_labrado, fecha_carga, dominio, velocidad_medida, velocidad_autorizada, estado
           FROM v_infracciones
          WHERE id=$1`,
        [row.id],
      );
      const acta = res.rows[0];

      // 🔔 Generar PDF de notificación si el servicio está activo
      try {
        if (this.notifs?.generarPdf) {
          await this.notifs.generarPdf(acta.id);
        } else {
          this.log.warn('NotificacionesService no disponible; se omite autogeneración de PDF.');
        }
      } catch (e: any) {
        this.log.warn(`Acta ${acta.id} guardada pero falló la autogeneración de PDF: ${e?.message || e}`);
      }

      return acta;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** === Listado de infracciones === */
  async list(q: any) {
    const where: string[] = [];
    const params: any[] = [];
    const push = (cl: string, v: any) => { params.push(v); where.push(cl.replace('$X', `$${params.length}`)); };
    if (q.dominio) push('i.dominio=$X', q.dominio.toUpperCase());
    if (q.acta)    push('i.nro_acta=$X', q.acta);
    if (q.estado)  push('i.estado=$X', q.estado);

    const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';

    // ✅ Consultamos directamente la vista v_infracciones
    const rows = await this.db.query(
      `SELECT id, nro_acta, dominio, fecha_labrado, fecha_carga,
              velocidad_medida, velocidad_autorizada, estado
         FROM v_infracciones i
         ${sqlWhere}
        ORDER BY fecha_labrado DESC
        LIMIT 200`,
      params,
    );

    return { page: 1, pageSize: rows.rows.length, total: rows.rows.length, items: rows.rows };
  }

  /** === Obtener una infracción === */
  async getOne(id: number) {
    const r = await this.db.query(
      `SELECT * FROM v_infracciones WHERE id=$1`,
      [id],
    );
    return r.rows[0];
  }

  /** === Actualizar (patch) === */
  async patch(id: number, dto: any) {
    const sets: string[] = [];
    const params: any[] = [];
    const push = (s: string, v: any) => { params.push(v); sets.push(s.replace('$X', `$${params.length}`)); };

    if (dto.ubicacion_texto      !== undefined) push('ubicacion_texto=$X', dto.ubicacion_texto);
    if (dto.velocidad_medida     !== undefined) push('velocidad_medida=$X', Number(dto.velocidad_medida) || 0);
    if (dto.velocidad_autorizada !== undefined) push('velocidad_autorizada=$X', Number(dto.velocidad_autorizada) || 0);
    if (dto.estado               !== undefined) push('estado=$X', dto.estado);
    if (dto.cam_serie            !== undefined) push('cam_serie=$X', dto.cam_serie);
    if (dto.tipo_vehiculo        !== undefined) push('tipo_vehiculo=$X', dto.tipo_vehiculo);
    if (dto.vehiculo_marca       !== undefined) push('vehiculo_marca=$X', dto.vehiculo_marca);
    if (dto.vehiculo_modelo      !== undefined) push('vehiculo_modelo=$X', dto.vehiculo_modelo);
    if (dto.arteria              !== undefined) push('arteria=$X', dto.arteria);
    if (dto.emision_texto        !== undefined) push('emision_texto=$X', dto.emision_texto);

    if (!sets.length) return { ok: true };
    await this.db.query(
      `UPDATE infracciones SET ${sets.join(', ')} WHERE id=$${params.length + 1}`,
      [...params, id],
    );
    return { ok: true };
  }
}
