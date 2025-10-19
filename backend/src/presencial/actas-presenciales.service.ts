import { Injectable, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import dayjs from 'dayjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const log = new Logger('ActasPresencialesService');

function numEnv(name: string, dflt: number): number {
  const raw = process.env[name];
  if (raw === undefined) return dflt;
  const n = Number(raw);
  return Number.isFinite(n) ? n : dflt;
}

const DATA_DIR = process.env.PRES_DATA_DIR || process.env.DATA_DIR || '/data';
const PDF_DIR = process.env.PRES_PDF_DIR || path.join(DATA_DIR, 'pdfs-presenciales');
const TPL_DIR = process.env.PRES_TPL_DIR || process.env.TEMPLATE_DIR || '/app/templates';
const TPL_PDF = process.env.PRES_TPL_PDF || path.join(TPL_DIR, 'acta-presencial-template.pdf');

@Injectable()
export class ActasPresencialesService {
  constructor(@Inject('PG') private readonly db?: Pool) {}

  async ensureDirs() {
    await fs.mkdir(PDF_DIR, { recursive: true }).catch(() => {});
  }

  /** =========================================
   *  CREAR ACTA PRESENCIAL EN DB
   *  ========================================= */
  async createPresencial(payload: any) {
    if (!this.db) throw new Error('DB pool no inyectado');
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const serie = payload.serie || 'P';
      const tipoInfraccion = 'Exceso de velocidad'; // 🔸 Valor fijo

      // Generar correlativo
      const up = await client.query(
        'UPDATE correlativos SET ultimo = ultimo + 1 WHERE serie = $1 RETURNING ultimo',
        [serie],
      );
      const n = up.rows[0]?.ultimo ?? 1;

      // Inserta nueva acta presencial (alineado con estructura actual)
      const ins = await client.query(
        `INSERT INTO actas_presenciales (
          serie, nro_correlativo, dominio, tipo_infraccion, fecha_acta,
          conductor_nombre, conductor_dni, conductor_domicilio,
          conductor_licencia, conductor_cp, conductor_departamento, conductor_provincia,
          veh_tipo, veh_marca, veh_modelo,
          titular_nombre, titular_dni_cuit, titular_domicilio,
          titular_cp, titular_departamento, titular_provincia,
          cine_marca, cine_modelo, cine_serie, cine_aprobacion,
          observaciones, estado, notificado, fecha_notificacion
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,
          $9,$10,$11,$12,
          $13,$14,$15,
          $16,$17,$18,
          $19,$20,$21,
          $22,$23,$24,$25,
          $26,$27,$28,$29
        )
        RETURNING id, serie, nro_correlativo`,
        [
          serie,
          n,
          (payload.dominio || '').toUpperCase(),
          tipoInfraccion,
          payload.fecha_acta || new Date(),

          // Conductor
          payload.infractor_nombre || null,
          payload.infractor_dni || null,
          payload.infractor_domicilio || null,
          payload.infractor_licencia || null,
          payload.infractor_cp || null,
          payload.infractor_departamento || null,
          payload.infractor_provincia || null,

          // Vehículo
          payload.tipo_vehiculo || null,
          payload.marca || null,
          payload.modelo || null,

          // Titular (si se obtiene desde padrón)
          payload.titular_nombre || null,
          payload.titular_dni || null,
          payload.titular_domicilio || null,
          payload.titular_cp || null,
          payload.titular_departamento || null,
          payload.titular_provincia || null,

          // Cinemático
          payload.cineMarca || null,
          payload.cineModelo || null,
          payload.cineSerie || null,
          payload.cineAprobacion || null,

          // Otros
          payload.observaciones || null,
          'notificada',
          true,
          payload.fecha_acta || new Date(),
        ],
      );

      const row = ins.rows[0];
      await client.query('COMMIT');

      const nro_acta = `${row.serie}-${String(row.nro_correlativo).padStart(7, '0')}`;
      log.log(`Acta presencial creada: ${nro_acta}`);

      return {
        id: row.id,
        nro_acta,
        serie: row.serie,
        nro_correlativo: row.nro_correlativo,
        tipo_infraccion: tipoInfraccion,
      };
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
      log.error(`Error al crear acta presencial: ${errMsg}`);
      throw e;
    } finally {
      client.release();
    }
  }

  /** =========================================
   *  GENERAR PDF DESDE REGISTRO DB
   *  ========================================= */
  async buildTicketBytesFromInfraccion(id: number) {
    if (!this.db) throw new Error('DB pool no inyectado');
    const r = await this.db.query(
      `SELECT
         i.id, i.serie, i.nro_correlativo, i.dominio, i.fecha_acta,
         i.veh_tipo, i.veh_marca, i.veh_modelo,
         i.conductor_nombre, i.conductor_dni, i.conductor_domicilio,
         t.nombre AS titular_nombre, t.dni AS titular_dni, t.domicilio AS titular_domicilio
       FROM actas_presenciales i
       LEFT JOIN titulares t ON t.dominio = i.dominio
       WHERE i.id = $1`,
      [id],
    );

    const row = r.rows[0];
    if (!row) throw new Error('Acta no encontrada');

    const nroActa = `${row.serie}-${String(row.nro_correlativo).padStart(7, '0')}`;
    const payload = {
      nroActa,
      fechaActa: row.fecha_acta || new Date(),
      dominio: row.dominio,
      conductorNombre: row.conductor_nombre,
      conductorDni: row.conductor_dni,
      conductorDomicilio: row.conductor_domicilio,
      vehTipo: row.veh_tipo,
      vehMarca: row.veh_marca,
      vehModelo: row.veh_modelo,
      titularNombre: row.titular_nombre,
      titularDni: row.titular_dni,
      titularDomicilio: row.titular_domicilio,
    };

    const bytes = await this.buildTicketBytes(payload);
    const filename = `PRES-${nroActa}.pdf`;
    return { bytes, filename };
  }

  /** =========================================
   *  GENERAR PDF (bytes)
   *  ========================================= */
  async buildTicketBytes(payload: any) {
    let tpl: Buffer | null = null;
    try {
      tpl = await fs.readFile(TPL_PDF);
    } catch {
      log.warn(`Plantilla no encontrada en ${TPL_PDF}, generando hoja en blanco.`);
    }

    const pdfDoc = tpl ? await PDFDocument.load(tpl) : await PDFDocument.create();
    if (!tpl) pdfDoc.addPage([210, 297]);

    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color = rgb(0, 0, 0);
    const mm = (n: number) => n * 2.8346;
    const yTop = (mmFromTop: number) => height - mm(mmFromTop);
    const draw = (txt: string, x: number, y: number, s = 9, b = false) =>
      page.drawText(txt ?? '', { x: mm(x), y: yTop(y), size: s, font: b ? bold : font, color });

    const f = dayjs(payload.fechaActa).format('DD/MM/YYYY');
    const h = dayjs(payload.fechaActa).format('HH:mm');

    draw(`${payload.nroActa}`, 20, 15, 10, true);
    draw(f, 20, 25);
    draw(h, 60, 25);
    draw(payload.dominio || '', 20, 35, 10, true);
    draw(payload.conductorNombre || '', 20, 50);
    draw(payload.conductorDni ? `DNI: ${payload.conductorDni}` : '', 20, 55);
    draw(payload.conductorDomicilio || '', 20, 60);
    draw(payload.vehTipo || '', 20, 90);
    draw(payload.vehMarca || '', 20, 95);
    draw(payload.vehModelo || '', 20, 100);

    return pdfDoc.save();
  }

  /** =========================================
   *  GUARDAR PDF EN DISCO
   *  ========================================= */
  async saveTicket(payload: any) {
    await this.ensureDirs();
    const bytes = await this.buildTicketBytes(payload);
    const filename = `PRES-${payload.nroActa}.pdf`;
    const outPath = path.join(PDF_DIR, filename);
    await fs.writeFile(outPath, bytes);
    return { filename, pdf_path: outPath, bytes };
  }
}
