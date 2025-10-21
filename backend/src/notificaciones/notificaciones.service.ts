// NotificacionesService.ts
import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const log = new Logger('NotificacionesService');

const DATA_DIR = process.env.DATA_DIR || '/data';
const PDF_DIR  = path.join(DATA_DIR, 'pdfs');
const TPL_DIR  = process.env.TEMPLATE_DIR || '/app/templates';
const TPL_PDF  = path.join(TPL_DIR, 'notificacion-template.pdf');

function numEnv(name: string, dflt: number): number {
  const raw = process.env[name];
  if (raw === undefined) return dflt;
  const n = Number(raw);
  return Number.isFinite(n) ? n : dflt;
}

const CAM_MARCA_CONST  = process.env.CAM_MARCA_CONST  || 'TRUCAM II';
const CAM_MODELO_CONST = process.env.CAM_MODELO_CONST || 'LTI 20/20';

@Injectable()
export class NotificacionesService implements OnModuleInit {
  constructor(@Inject('PG') private readonly db: Pool) {}

  async onModuleInit() {
    // aseguramos índice único (no falla si ya existe)
    await this.db
      .query(
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_notificaciones_infraccion
           ON notificaciones(infraccion_id)`
      )
      .catch((e) => log.warn(`No pude crear índice único (ok si ya existe): ${e}`));

    // carpeta /data/pdfs segura
    await fs.mkdir(PDF_DIR, { recursive: true }).catch(() => {});
  }

  // -------- utilidades --------
  private async loadInfraccion(infraccionId: number) {
    const r = await this.db.query(
      `SELECT
         i.id,
         (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta,
         i.serie, i.nro_correlativo,
         i.dominio, i.fecha_labrado, i.fecha_notificacion,
         i.ubicacion_texto, i.lat, i.lng,
         i.foto_file_id, i.cam_serie,
         i.tipo_vehiculo, i.vehiculo_marca, i.vehiculo_modelo,
         i.titular_nombre, i.titular_dni_cuit AS titular_dni, i.titular_domicilio
       FROM infracciones i
       WHERE i.id = $1`,
      [infraccionId]
    );
    return r.rows[0];
  }

  private actaNro(row: any) {
    if (row.nro_acta) return row.nro_acta;
    const n = String(row.nro_correlativo || '').padStart(7, '0');
    return `${row.serie || 'A'}-${n}`;
  }

  // =================== IDPOTENTE: generar/actualizar PDF ===================
  async generarPdf(infraccionId: number) {
    const row = await this.loadInfraccion(infraccionId);
    if (!row) throw new Error('Infracción no encontrada');

    await fs.mkdir(PDF_DIR, { recursive: true });

    const filename = `ACTA-${this.actaNro(row)}.pdf`;
    const outPath  = path.join(PDF_DIR, filename);

    const bytes = await this.buildPdfBytes(row);
    await fs.writeFile(outPath, bytes);

    // UPSERT que NO degrada 'enviado'
    const up = await this.db.query(
      `INSERT INTO notificaciones (infraccion_id, pdf_path, estado)
       VALUES ($1, $2, 'generado')
       ON CONFLICT (infraccion_id) DO UPDATE
         SET pdf_path = EXCLUDED.pdf_path,
             estado   = CASE
                          WHEN notificaciones.estado = 'enviado' THEN 'enviado'
                          ELSE 'generado'
                        END
       RETURNING id, infraccion_id, pdf_path, estado, created_at, sent_at`,
      [infraccionId, outPath]
    );

    const n = up.rows[0];
    return { id: n.id, pdf_path: n.pdf_path, estado: n.estado, filename };
  }

  // Para descarga/preview sin tocar DB
  async generarPdfStream(infraccionId: number) {
    const row = await this.loadInfraccion(infraccionId);
    if (!row) throw new Error('Infracción no encontrada');
    const filename = `ACTA-${this.actaNro(row)}.pdf`;
    const bytes = await this.buildPdfBytes(row);
    return { bytes, filename };
  }

  // -------------------- armado del PDF --------------------
  private async buildPdfBytes(row: any) {
    let tpl: Buffer;
    try {
      tpl = await fs.readFile(TPL_PDF);
    } catch {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText('Plantilla no encontrada. Copie notificacion-template.pdf en /app/templates', {
        x: 40,
        y: 800,
        size: 12,
        font,
        color: rgb(1, 0, 0),
      });
      return pdfDoc.save();
    }

    const pdfDoc = await PDFDocument.load(tpl);
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color = rgb(0, 0, 0);

    const mm = (n: number) => n * 2.83464567;
    const yTop = (mmFromTop: number) => height - mm(mmFromTop);

    // Sanitize special characters for WinAnsi encoding
    const sanitize = (text: string): string => {
      if (!text) return '';
      try {
        // First normalize to NFD and remove combining diacritics
        let result = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Then apply specific character replacements for common Spanish chars
        const charMap: Record<string, string> = {
          'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
          'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
          'ñ': 'n', 'Ñ': 'N', 'ü': 'u', 'Ü': 'U',
        };
        for (const [special, normal] of Object.entries(charMap)) {
          result = result.split(special).join(normal);
        }
        // Finally, remove any remaining non-printable ASCII or non-ASCII characters
        result = result.replace(/[^\x20-\x7E]/g, '');
        return result;
      } catch (e) {
        // Fallback: just remove all non-ASCII
        return (text || '').replace(/[^\x20-\x7E]/g, '');
      }
    };

    const draw = (text: string, xmm: number, ymmFromTop: number, size = 9, bold = false) => {
      try {
        const sanitized = sanitize(text ?? '');
        page.drawText(sanitized, {
          x: mm(xmm),
          y: yTop(ymmFromTop),
          size,
          font: bold ? fontBold : font,
          color,
        });
      } catch (e: any) {
        // If encoding fails, log warning and skip this field
        log.warn(`Failed to draw text "${text}": ${e?.message || e}`);
      }
    };

    const acta = this.actaNro(row);
    const fechaLabrado = row.fecha_labrado ? dayjs(row.fecha_labrado).format('DD/MM/YYYY') : '';
    const horaLabrado = row.fecha_labrado ? dayjs(row.fecha_labrado).format('HH:mm') : '';
    const fechaNotificacion = row.fecha_notificacion ? dayjs(row.fecha_notificacion).format('DD/MM/YYYY') : '';
    const dominio = row.dominio ?? '';
    const ubicacion = row.ubicacion_texto ?? '';

    const tipoVeh = (row.tipo_vehiculo ?? '').toString();
    const marca = (row.vehiculo_marca ?? '').toString();
    const modelo = (row.vehiculo_modelo ?? '').toString();
    const serieCam = (row.cam_serie ?? '').toString();

    const titularNombre = row.titular_nombre ?? '';
    const titularDni = row.titular_dni ?? '';
    const titularDom = row.titular_domicilio ?? '';

    const P_ACTA_X = numEnv('NOTIF_ACTA_X_MM', 66);
    const P_ACTA_Y = numEnv('NOTIF_ACTA_Y_MM', 81);

    const P_FECHA_X = numEnv('NOTIF_FECHA_X_MM', 45);
    const P_FECHA_Y = numEnv('NOTIF_FECHA_Y_MM', 86);
    const P_HORA_X = numEnv('NOTIF_HORA_X_MM', 75);
    const P_HORA_Y = numEnv('NOTIF_HORA_Y_MM', 86);

    const P_UBIC_X = numEnv('NOTIF_UBIC_X_MM', 37);
    const P_UBIC_Y = numEnv('NOTIF_UBIC_Y_MM', 91);

    const P_DOM_X = numEnv('NOTIF_DOM_X_MM', 72);
    const P_DOM_Y = numEnv('NOTIF_DOM_Y_MM', 97);

    const P_TIPO_X = numEnv('NOTIF_TIPO_VEH_X_MM', 53);
    const P_TIPO_Y = numEnv('NOTIF_TIPO_VEH_Y_MM', 103);

    const P_MARCA_X = numEnv('NOTIF_MARCA_X_MM', 40);
    const P_MARCA_Y = numEnv('NOTIF_MARCA_Y_MM', 108);

    const P_MODELO_X = numEnv('NOTIF_MODELO_X_MM', 40);
    const P_MODELO_Y = numEnv('NOTIF_MODELO_Y_MM', 113);

    const P_CAM_MARCA_X = numEnv('NOTIF_CAM_MARCA_X_MM', 125);
    const P_CAM_MARCA_Y = numEnv('NOTIF_CAM_MARCA_Y_MM', 166);
    const P_CAM_MODELO_X = numEnv('NOTIF_CAM_MODELO_X_MM', 125);
    const P_CAM_MODELO_Y = numEnv('NOTIF_CAM_MODELO_Y_MM', 172);

    const P_SERIE_X = numEnv('NOTIF_SERIECAM_X_MM', 125);
    const P_SERIE_Y = numEnv('NOTIF_SERIECAM_Y_MM', 177);

    const P_TITNOM_X = numEnv('NOTIF_TIT_NOM_X_MM', 40);
    const P_TITNOM_Y = numEnv('NOTIF_TIT_NOM_Y_MM', 118);
    const P_TITDNI_X = numEnv('NOTIF_TIT_DNI_X_MM', 40);
    const P_TITDNI_Y = numEnv('NOTIF_TIT_DNI_Y_MM', 123);
    const P_TITDOM_X = numEnv('NOTIF_TIT_DOM_X_MM', 40);
    const P_TITDOM_Y = numEnv('NOTIF_TIT_DOM_Y_MM', 128);

    const P_FECHANOTIF_X = numEnv('NOTIF_FECHA_NOTIF_X_MM', 150);
    const P_FECHANOTIF_Y = numEnv('NOTIF_FECHA_NOTIF_Y_MM', 260);

    draw(`${acta}`, P_ACTA_X, P_ACTA_Y, 10, true);
    draw(`${fechaLabrado}`, P_FECHA_X, P_FECHA_Y);
    draw(`${horaLabrado}`, P_HORA_X, P_HORA_Y);
    draw(`${ubicacion}`, P_UBIC_X, P_UBIC_Y);
    draw(`${dominio}`, P_DOM_X, P_DOM_Y, 10, true);

    draw(`${tipoVeh}`, P_TIPO_X, P_TIPO_Y);
    draw(`${marca}`, P_MARCA_X, P_MARCA_Y);
    draw(`${modelo}`, P_MODELO_X, P_MODELO_Y);

    draw(CAM_MARCA_CONST, P_CAM_MARCA_X, P_CAM_MARCA_Y, 9, true);
    draw(CAM_MODELO_CONST, P_CAM_MODELO_X, P_CAM_MODELO_Y, 9, true);

    if (serieCam) draw(`${serieCam}`, P_SERIE_X, P_SERIE_Y);

    draw(`${titularNombre}`, P_TITNOM_X, P_TITNOM_Y);
    draw(`DNI: ${titularDni}`, P_TITDNI_X, P_TITDNI_Y);
    draw(`${titularDom}`, P_TITDOM_X, P_TITDOM_Y);

    // Fecha de notificación
    if (fechaNotificacion) {
      draw(`Notificado: ${fechaNotificacion}`, P_FECHANOTIF_X, P_FECHANOTIF_Y, 8);
    }

    const PHOTO_X_MM = numEnv('NOTIF_PHOTO_X_MM', 102);
    const PHOTO_Y_MM = numEnv('NOTIF_PHOTO_Y_MM', 70);
    const PHOTO_W_MM = numEnv('NOTIF_PHOTO_W_MM', 100);
    const PHOTO_H_MM = numEnv('NOTIF_PHOTO_H_MM', 75);

    if (String(process.env.NOTIF_DEBUG_GRID || '').toLowerCase() === 'true') {
      page.drawRectangle({
        x: mm(PHOTO_X_MM),
        y: yTop(PHOTO_Y_MM) - mm(PHOTO_H_MM),
        width: mm(PHOTO_W_MM),
        height: mm(PHOTO_H_MM),
        borderColor: rgb(1, 0, 0),
        borderWidth: 1,
      });
    }

    if (row.foto_file_id) {
      try {
        const imgPath = path.join(DATA_DIR, 'uploads', row.foto_file_id);
        const imgBytes = await fs.readFile(imgPath);
        const ext = path.extname(imgPath).toLowerCase();
        const img = ext === '.png' ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

        const maxW = mm(PHOTO_W_MM);
        const maxH = mm(PHOTO_H_MM);
        const { width: iw, height: ih } = img.scale(1);
        const scale = Math.min(maxW / iw, maxH / ih);
        const drawW = iw * scale;
        const drawH = ih * scale;

        const x = mm(PHOTO_X_MM) + (maxW - drawW) / 2;
        const y = yTop(PHOTO_Y_MM) - (maxH - drawH) / 2 - drawH;

        page.drawImage(img, { x, y, width: drawW, height: drawH });
      } catch {
        // la falta de foto no bloquea
      }
    }

    return pdfDoc.save();
  }

  // =================== Envío por email (idempotente) ===================
  async enviar(notificacionId: number, email: string) {
    const r = await this.db.query(
      `SELECT n.id, n.pdf_path, n.estado, n.infraccion_id,
              (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta
         FROM notificaciones n
         JOIN infracciones i ON i.id = n.infraccion_id
        WHERE n.id=$1`,
      [notificacionId]
    );
    const row = r.rows[0];
    if (!row) throw new Error('Notificación no encontrada');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const subj = `Notificación Acta ${row.nro_acta || ''}`;
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@seguridadvial.local',
      to: email,
      subject: subj,
      text: `Adjuntamos la Notificación del acta ${row.nro_acta || ''}.`,
      html: `<p>Adjuntamos la <b>Notificación</b> del acta <b>${row.nro_acta || ''}</b>.</p>`,
      attachments: [{ filename: path.basename(row.pdf_path), path: row.pdf_path }],
    });

    const upd = await this.db.query(
      `UPDATE notificaciones
          SET estado='enviado', email=$1, sent_at=now()
        WHERE id=$2
        RETURNING infraccion_id`,
      [email, notificacionId]
    );

    const infId = upd.rows[0]?.infraccion_id ?? row.infraccion_id;
    // “doble seguro”: si no hay trigger, actualizo flags
    await this.db.query(
      `UPDATE infracciones
          SET notificado = TRUE,
              fecha_notificacion = COALESCE(fecha_notificacion, now())
        WHERE id = $1`,
      [infId]
    );

    return { ok: true };
  }
}
