var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import dayjs from 'dayjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
const log = new Logger('ActasPresencialesService');
function numEnv(name, dflt) {
    const raw = process.env[name];
    if (raw === undefined)
        return dflt;
    const n = Number(raw);
    return Number.isFinite(n) ? n : dflt;
}
const DATA_DIR = process.env.PRES_DATA_DIR || process.env.DATA_DIR || '/data';
const PDF_DIR = process.env.PRES_PDF_DIR || path.join(DATA_DIR, 'pdfs-presenciales');
const TPL_DIR = process.env.PRES_TPL_DIR || process.env.TEMPLATE_DIR || '/app/templates';
const TPL_PDF = process.env.PRES_TPL_PDF || path.join(TPL_DIR, 'acta-presencial-template.pdf');
let ActasPresencialesService = class ActasPresencialesService {
    async ensureDirs() {
        await fs.mkdir(PDF_DIR, { recursive: true }).catch(() => { });
    }
    async buildTicketBytes(payload) {
        let tpl = null;
        try {
            tpl = await fs.readFile(TPL_PDF);
        }
        catch {
            log.warn(`Plantilla de ticket no encontrada en ${TPL_PDF}, generando hoja en blanco preventivamente.`);
        }
        const pdfDoc = tpl ? await PDFDocument.load(tpl) : await PDFDocument.create();
        if (!tpl)
            pdfDoc.addPage([210, 297]);
        const page = pdfDoc.getPage(0);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const color = rgb(0, 0, 0);
        const mm = (n) => n * 2.83464567;
        const yTop = (mmFromTop) => height - mm(mmFromTop);
        const draw = (text, xmm, ymmFromTop, size = 9, bold = false) => {
            page.drawText(text ?? '', {
                x: mm(xmm),
                y: yTop(ymmFromTop),
                size,
                font: bold ? fontBold : font,
                color,
            });
        };
        const fecha = dayjs(payload.fechaActa);
        const f = fecha.isValid() ? fecha.format('DD/MM/YYYY') : '';
        const t = fecha.isValid() ? fecha.format('HH:mm') : '';
        const X_ACTA = numEnv('PRES_ACTA_X_MM', 20);
        const Y_ACTA = numEnv('PRES_ACTA_Y_MM', 15);
        const X_FECHA = numEnv('PRES_FECHA_X_MM', 20);
        const Y_FECHA = numEnv('PRES_FECHA_Y_MM', 25);
        const X_HORA = numEnv('PRES_HORA_X_MM', 60);
        const Y_HORA = numEnv('PRES_HORA_Y_MM', 25);
        const X_DOM = numEnv('PRES_DOM_X_MM', 20);
        const Y_DOM = numEnv('PRES_DOM_Y_MM', 35);
        const X_CNOM = numEnv('PRES_COND_NOM_X_MM', 20);
        const Y_CNOM = numEnv('PRES_COND_NOM_Y_MM', 50);
        const X_CDNI = numEnv('PRES_COND_DNI_X_MM', 20);
        const Y_CDNI = numEnv('PRES_COND_DNI_Y_MM', 55);
        const X_CDOM = numEnv('PRES_COND_DOM_X_MM', 20);
        const Y_CDOM = numEnv('PRES_COND_DOM_Y_MM', 60);
        const X_CCP = numEnv('PRES_COND_CP_X_MM', 20);
        const Y_CCP = numEnv('PRES_COND_CP_Y_MM', 65);
        const X_CDEP = numEnv('PRES_COND_DEPTO_X_MM', 20);
        const Y_CDEP = numEnv('PRES_COND_DEPTO_Y_MM', 70);
        const X_CPRO = numEnv('PRES_COND_PROV_X_MM', 20);
        const Y_CPRO = numEnv('PRES_COND_PROV_Y_MM', 75);
        const X_VTIP = numEnv('PRES_VEH_TIPO_X_MM', 20);
        const Y_VTIP = numEnv('PRES_VEH_TIPO_Y_MM', 90);
        const X_VMAR = numEnv('PRES_VEH_MARCA_X_MM', 20);
        const Y_VMAR = numEnv('PRES_VEH_MARCA_Y_MM', 95);
        const X_VMOD = numEnv('PRES_VEH_MODELO_X_MM', 20);
        const Y_VMOD = numEnv('PRES_VEH_MODELO_Y_MM', 100);
        const X_TNOM = numEnv('PRES_TIT_NOM_X_MM', 9999);
        const Y_TNOM = numEnv('PRES_TIT_NOM_Y_MM', 9999);
        const X_TDNI = numEnv('PRES_TIT_DNI_X_MM', 9999);
        const Y_TDNI = numEnv('PRES_TIT_DNI_Y_MM', 9999);
        const X_TDOM = numEnv('PRES_TIT_DOM_X_MM', 9999);
        const Y_TDOM = numEnv('PRES_TIT_DOM_Y_MM', 9999);
        draw(`${payload.nroActa}`, X_ACTA, Y_ACTA, 10, true);
        draw(f, X_FECHA, Y_FECHA);
        draw(t, X_HORA, Y_HORA);
        draw(payload.dominio || '', X_DOM, Y_DOM, 10, true);
        draw(payload.conductorNombre || '', X_CNOM, Y_CNOM);
        draw(payload.conductorDni ? `DNI: ${payload.conductorDni}` : '', X_CDNI, Y_CDNI);
        draw(payload.conductorDomicilio || '', X_CDOM, Y_CDOM);
        draw(payload.conductorCP || '', X_CCP, Y_CCP);
        draw(payload.conductorDepartamento || '', X_CDEP, Y_CDEP);
        draw(payload.conductorProvincia || '', X_CPRO, Y_CPRO);
        draw(payload.vehTipo || '', X_VTIP, Y_VTIP);
        draw(payload.vehMarca || '', X_VMAR, Y_VMAR);
        draw(payload.vehModelo || '', X_VMOD, Y_VMOD);
        if (payload.titularNombre)
            draw(payload.titularNombre, X_TNOM, Y_TNOM);
        if (payload.titularDni)
            draw(`DNI: ${payload.titularDni}`, X_TDNI, Y_TDNI);
        if (payload.titularDomicilio)
            draw(payload.titularDomicilio, X_TDOM, Y_TDOM);
        return pdfDoc.save();
    }
    async saveTicket(payload) {
        await this.ensureDirs();
        const bytes = await this.buildTicketBytes(payload);
        const filename = `PRES-${payload.nroActa}.pdf`;
        const outPath = path.join(PDF_DIR, filename);
        await fs.writeFile(outPath, bytes);
        return { filename, pdf_path: outPath, bytes };
    }
};
ActasPresencialesService = __decorate([
    Injectable()
], ActasPresencialesService);
export { ActasPresencialesService };
