import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

// ====== Constantes de la cámara (no cambian entre equipos) ======
const CAM_MARCA_CONST  = process.env.CAM_MARCA_CONST  || 'TRUCAM II';
const CAM_MODELO_CONST = process.env.CAM_MODELO_CONST || 'LTI 20/20';

@Injectable()
export class NotificacionesService {
  constructor(@Inject('PG') private readonly db: Pool) {}

  // Carga datos de la infracción + titular; calcula nro_acta
  private async loadInfraccion(infraccionId: number) {
    const r = await this.db.query(
      `SELECT
         i.id,
         (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta,
         i.serie,
         i.nro_correlativo,
         i.dominio,
         i.fecha_labrado,
         i.ubicacion_texto,
         i.lat, i.lng,
         i.foto_file_id,
         i.cam_serie,                    -- N° de serie guardado
         i.tipo_vehiculo,
         i.vehiculo_marca,
         i.vehiculo_modelo,
         t.nombre    AS titular_nombre,
         t.dni       AS titular_dni,
         t.domicilio AS titular_domicilio
       FROM infracciones i
       LEFT JOIN titulares t ON t.dominio = i.dominio
       WHERE i.id = $1`,
      [infraccionId]
    );
    return r.rows[0];
  }

  private actaNro(row: any) {
    if (row.nro_acta) return row.nro_acta;
    const n = String(row.nro_correlativo || '').padStart(7,'0');
    return `${row.serie || 'A'}-${n}`;
  }

  // Genera y persiste el PDF
  async generarPdf(infraccionId: number) {
    const row = await this.loadInfraccion(infraccionId);
    if (!row) throw new Error('Infracción no encontrada');

    await fs.mkdir(PDF_DIR, { recursive: true });

    const filename = `ACTA-${this.actaNro(row)}.pdf`;
    const outPath  = path.join(PDF_DIR, filename);

    const bytes = await this.buildPdfBytes(row);
    await fs.writeFile(outPath, bytes);

    const ins = await this.db.query(
      `INSERT INTO notificaciones(infraccion_id, pdf_path, estado)
       VALUES($1,$2,'generado')
       RETURNING id, pdf_path, estado, created_at`,
      [infraccionId, outPath]
    );

    return {
      id: ins.rows[0].id,
      pdf_path: outPath,
      estado: ins.rows[0].estado,
      filename,
    };
  }

  // Genera bytes para streaming (descarga/visualización)
  async generarPdfStream(infraccionId: number) {
    const row = await this.loadInfraccion(infraccionId);
    if (!row) throw new Error('Infracción no encontrada');
    const filename = `ACTA-${this.actaNro(row)}.pdf`;
    const bytes = await this.buildPdfBytes(row);
    return { bytes, filename };
  }

  // ======================== BUILD PDF =========================
  private async buildPdfBytes(row: any) {
    // 1) Plantilla
    let tpl: Buffer;
    try {
      tpl = await fs.readFile(TPL_PDF);
    } catch {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText('Plantilla no encontrada. Copie notificacion-template.pdf en /app/templates', {
        x: 40, y: 800, size: 12, font, color: rgb(1, 0, 0),
      });
      return pdfDoc.save();
    }

    const pdfDoc = await PDFDocument.load(tpl);
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();

    // 2) Fuentes y helpers
    const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const color    = rgb(0, 0, 0);

    const mm  = (n: number) => n * 2.83464567;   // 1 mm ≈ 2.8346 pt
    const yTop = (mmFromTop: number) => height - mm(mmFromTop);
    const draw = (text: string, xmm: number, ymmFromTop: number, size=9, bold=false) => {
      page.drawText(text ?? '', {
        x: mm(xmm), y: yTop(ymmFromTop),
        size,
        font: bold ? fontBold : font,
        color
      });
    };

    // 3) Variables (SOLO valores)
    const acta          = this.actaNro(row);
    const fechaLabrado  = row.fecha_labrado ? dayjs(row.fecha_labrado).format('DD/MM/YYYY') : '';
    const horaLabrado   = row.fecha_labrado ? dayjs(row.fecha_labrado).format('HH:mm') : '';
    const dominio       = row.dominio ?? '';
    const ubicacion     = row.ubicacion_texto ?? '';

    const tipoVeh       = (row.tipo_vehiculo   ?? '').toString();
    const marca         = (row.vehiculo_marca  ?? '').toString();
    const modelo        = (row.vehiculo_modelo ?? '').toString();
    const serieCam      = (row.cam_serie       ?? '').toString();

    const titularNombre = row.titular_nombre ?? '';
    const titularDni    = row.titular_dni ?? '';
    const titularDom    = row.titular_domicilio ?? '';

    // 4) Posiciones (ajustables por ENV — NO tocamos tus calibradas)
    const P_ACTA_X = numEnv('NOTIF_ACTA_X_MM', 66);
    const P_ACTA_Y = numEnv('NOTIF_ACTA_Y_MM', 81);

    const P_FECHA_X = numEnv('NOTIF_FECHA_X_MM', 45);
    const P_FECHA_Y = numEnv('NOTIF_FECHA_Y_MM', 86);
    const P_HORA_X  = numEnv('NOTIF_HORA_X_MM', 75);
    const P_HORA_Y  = numEnv('NOTIF_HORA_Y_MM', 86);

    const P_UBIC_X  = numEnv('NOTIF_UBIC_X_MM', 37);
    const P_UBIC_Y  = numEnv('NOTIF_UBIC_Y_MM', 91);

    const P_DOM_X   = numEnv('NOTIF_DOM_X_MM', 72);
    const P_DOM_Y   = numEnv('NOTIF_DOM_Y_MM', 97);

    // Vehículo (valores)
    const P_TIPO_X  = numEnv('NOTIF_TIPO_VEH_X_MM', 53);
    const P_TIPO_Y  = numEnv('NOTIF_TIPO_VEH_Y_MM', 103);

    const P_MARCA_X = numEnv('NOTIF_MARCA_X_MM', 40);
    const P_MARCA_Y = numEnv('NOTIF_MARCA_Y_MM', 108);

    const P_MODELO_X= numEnv('NOTIF_MODELO_X_MM', 40);
    const P_MODELO_Y= numEnv('NOTIF_MODELO_Y_MM', 113);

    // Cámara: marca/modelo (constantes) y serie (valor)
    const P_CAM_MARCA_X  = numEnv('NOTIF_CAM_MARCA_X_MM', 125);
    const P_CAM_MARCA_Y  = numEnv('NOTIF_CAM_MARCA_Y_MM', 166);
    const P_CAM_MODELO_X = numEnv('NOTIF_CAM_MODELO_X_MM', 125);
    const P_CAM_MODELO_Y = numEnv('NOTIF_CAM_MODELO_Y_MM', 172);

    const P_SERIE_X = numEnv('NOTIF_SERIECAM_X_MM', 125);
    const P_SERIE_Y = numEnv('NOTIF_SERIECAM_Y_MM', 177);

    const P_TITNOM_X= numEnv('NOTIF_TIT_NOM_X_MM', 40);
    const P_TITNOM_Y= numEnv('NOTIF_TIT_NOM_Y_MM', 118);
    const P_TITDNI_X= numEnv('NOTIF_TIT_DNI_X_MM', 40);
    const P_TITDNI_Y= numEnv('NOTIF_TIT_DNI_Y_MM', 123);
    const P_TITDOM_X= numEnv('NOTIF_TIT_DOM_X_MM', 40);
    const P_TITDOM_Y= numEnv('NOTIF_TIT_DOM_Y_MM', 128);

    // ---- Dibujo (NO tocamos tus offsets existentes)
    draw(`${acta}`,         P_ACTA_X,  P_ACTA_Y, 10, true);
    draw(`${fechaLabrado}`, P_FECHA_X, P_FECHA_Y);
    draw(`${horaLabrado}`,  P_HORA_X,  P_HORA_Y);
    draw(`${ubicacion}`,    P_UBIC_X,  P_UBIC_Y);
    draw(`${dominio}`,      P_DOM_X,   P_DOM_Y, 10, true);

    draw(`${tipoVeh}`,      P_TIPO_X,  P_TIPO_Y);
    draw(`${marca}`,        P_MARCA_X, P_MARCA_Y);
    draw(`${modelo}`,       P_MODELO_X,P_MODELO_Y);

    // Marca y Modelo de la cámara (constantes)
    draw(CAM_MARCA_CONST,   P_CAM_MARCA_X,  P_CAM_MARCA_Y, 9, true);
    draw(CAM_MODELO_CONST,  P_CAM_MODELO_X, P_CAM_MODELO_Y, 9, true);

    // Serie (valor)
    if (serieCam) {
      draw(`${serieCam}`,   P_SERIE_X, P_SERIE_Y);
    }

    draw(`${titularNombre}`,P_TITNOM_X,P_TITNOM_Y);
    draw(`DNI: ${titularDni}`, P_TITDNI_X,P_TITDNI_Y);
    draw(`${titularDom}`,   P_TITDOM_X,P_TITDOM_Y);

    // 5) FOTO
    const PHOTO_X_MM = numEnv('NOTIF_PHOTO_X_MM', 102);
    const PHOTO_Y_MM = numEnv('NOTIF_PHOTO_Y_MM',  70);
    const PHOTO_W_MM = numEnv('NOTIF_PHOTO_W_MM', 100);
    const PHOTO_H_MM = numEnv('NOTIF_PHOTO_H_MM',  75);

    if (String(process.env.NOTIF_DEBUG_GRID || '').toLowerCase() === 'true') {
      page.drawRectangle({
        x: mm(PHOTO_X_MM),
        y: yTop(PHOTO_Y_MM) - mm(PHOTO_H_MM),
        width: mm(PHOTO_W_MM),
        height: mm(PHOTO_H_MM),
        borderColor: rgb(1, 0, 0), borderWidth: 1,
      });
    }

    if (row.foto_file_id) {
      try {
        const imgPath = path.join(DATA_DIR, 'uploads', row.foto_file_id);
        const imgBytes = await fs.readFile(imgPath);
        const ext = path.extname(imgPath).toLowerCase();

        const img = (ext === '.png')
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);

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
        // no bloquea la generación si la imagen no está
      }
    }

    return pdfDoc.save();
  }

  // Enviar mail con adjunto
  async enviar(notificacionId: number, email: string) {
    const r = await this.db.query(
      `SELECT n.id, n.pdf_path, n.estado, (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) AS nro_acta
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
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
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

    await this.db.query(
      `UPDATE notificaciones SET estado='enviado', email=$1, sent_at=now() WHERE id=$2`,
      [email, notificacionId]
    );

    return { ok: true };
  }
}
