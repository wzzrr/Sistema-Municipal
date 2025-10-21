var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import dayjs from 'dayjs';
import sharp from 'sharp';
const log = new Logger('ActasPresencialesService');
function numEnv(name, dflt) {
    const raw = process.env[name];
    if (raw === undefined)
        return dflt;
    const n = Number(raw);
    return Number.isFinite(n) ? n : dflt;
}
const DATA_DIR = process.env.PRES_DATA_DIR || process.env.DATA_DIR || '/data';
const PNG_DIR = process.env.PRES_PNG_DIR || path.join(DATA_DIR, 'pngs-presenciales');
const TPL_DIR = process.env.PRES_TPL_DIR || process.env.TEMPLATE_DIR || '/app/templates';
const TPL_PNG = process.env.PRES_TPL_PNG || path.join(TPL_DIR, 'acta-presencial-template.png');
const IMG_WIDTH = 832;
const IMG_HEIGHT = 2172;
const IMG_DPI = 203;
const MM_TO_PX = 8;
const PRES_ACTA_X = numEnv('PRES_ACTA_X_MM', 20) * MM_TO_PX;
const PRES_ACTA_Y = numEnv('PRES_ACTA_Y_MM', 15) * MM_TO_PX;
const PRES_FECHA_X = numEnv('PRES_FECHA_X_MM', 20) * MM_TO_PX;
const PRES_FECHA_Y = numEnv('PRES_FECHA_Y_MM', 25) * MM_TO_PX;
const PRES_HORA_X = numEnv('PRES_HORA_X_MM', 60) * MM_TO_PX;
const PRES_HORA_Y = numEnv('PRES_HORA_Y_MM', 25) * MM_TO_PX;
const PRES_DOMINIO_X = numEnv('PRES_DOMINIO_X_MM', 20) * MM_TO_PX;
const PRES_DOMINIO_Y = numEnv('PRES_DOMINIO_Y_MM', 35) * MM_TO_PX;
const PRES_CONDUCTOR_NOMBRE_X = numEnv('PRES_CONDUCTOR_NOMBRE_X_MM', 20) * MM_TO_PX;
const PRES_CONDUCTOR_NOMBRE_Y = numEnv('PRES_CONDUCTOR_NOMBRE_Y_MM', 50) * MM_TO_PX;
const PRES_CONDUCTOR_DNI_X = numEnv('PRES_CONDUCTOR_DNI_X_MM', 20) * MM_TO_PX;
const PRES_CONDUCTOR_DNI_Y = numEnv('PRES_CONDUCTOR_DNI_Y_MM', 55) * MM_TO_PX;
const PRES_CONDUCTOR_DOM_X = numEnv('PRES_CONDUCTOR_DOM_X_MM', 20) * MM_TO_PX;
const PRES_CONDUCTOR_DOM_Y = numEnv('PRES_CONDUCTOR_DOM_Y_MM', 60) * MM_TO_PX;
const PRES_CONDUCTOR_LIC_NRO_X = numEnv('PRES_CONDUCTOR_LIC_NRO_X_MM', 20) * MM_TO_PX;
const PRES_CONDUCTOR_LIC_NRO_Y = numEnv('PRES_CONDUCTOR_LIC_NRO_Y_MM', 65) * MM_TO_PX;
const PRES_CONDUCTOR_LIC_CLASE_X = numEnv('PRES_CONDUCTOR_LIC_CLASE_X_MM', 60) * MM_TO_PX;
const PRES_CONDUCTOR_LIC_CLASE_Y = numEnv('PRES_CONDUCTOR_LIC_CLASE_Y_MM', 65) * MM_TO_PX;
const PRES_CONDUCTOR_CP_X = numEnv('PRES_CONDUCTOR_CP_X_MM', 20) * MM_TO_PX;
const PRES_CONDUCTOR_CP_Y = numEnv('PRES_CONDUCTOR_CP_Y_MM', 70) * MM_TO_PX;
const PRES_CONDUCTOR_DEPTO_X = numEnv('PRES_CONDUCTOR_DEPTO_X_MM', 35) * MM_TO_PX;
const PRES_CONDUCTOR_DEPTO_Y = numEnv('PRES_CONDUCTOR_DEPTO_Y_MM', 70) * MM_TO_PX;
const PRES_CONDUCTOR_PROV_X = numEnv('PRES_CONDUCTOR_PROV_X_MM', 60) * MM_TO_PX;
const PRES_CONDUCTOR_PROV_Y = numEnv('PRES_CONDUCTOR_PROV_Y_MM', 70) * MM_TO_PX;
const PRES_TITULAR_NOMBRE_X = numEnv('PRES_TITULAR_NOMBRE_X_MM', 20) * MM_TO_PX;
const PRES_TITULAR_NOMBRE_Y = numEnv('PRES_TITULAR_NOMBRE_Y_MM', 70) * MM_TO_PX;
const PRES_TITULAR_DNI_X = numEnv('PRES_TITULAR_DNI_X_MM', 20) * MM_TO_PX;
const PRES_TITULAR_DNI_Y = numEnv('PRES_TITULAR_DNI_Y_MM', 75) * MM_TO_PX;
const PRES_TITULAR_DOMICILIO_X = numEnv('PRES_TITULAR_DOMICILIO_X_MM', 20) * MM_TO_PX;
const PRES_TITULAR_DOMICILIO_Y = numEnv('PRES_TITULAR_DOMICILIO_Y_MM', 78) * MM_TO_PX;
const PRES_TITULAR_CP_X = numEnv('PRES_TITULAR_CP_X_MM', 20) * MM_TO_PX;
const PRES_TITULAR_CP_Y = numEnv('PRES_TITULAR_CP_Y_MM', 80) * MM_TO_PX;
const PRES_TITULAR_DEPTO_X = numEnv('PRES_TITULAR_DEPTO_X_MM', 20) * MM_TO_PX;
const PRES_TITULAR_DEPTO_Y = numEnv('PRES_TITULAR_DEPTO_Y_MM', 85) * MM_TO_PX;
const PRES_TITULAR_PROV_X = numEnv('PRES_TITULAR_PROV_X_MM', 20) * MM_TO_PX;
const PRES_TITULAR_PROV_Y = numEnv('PRES_TITULAR_PROV_Y_MM', 90) * MM_TO_PX;
const PRES_VEH_TIPO_X = numEnv('PRES_VEH_TIPO_X_MM', 20) * MM_TO_PX;
const PRES_VEH_TIPO_Y = numEnv('PRES_VEH_TIPO_Y_MM', 90) * MM_TO_PX;
const PRES_VEH_MARCA_X = numEnv('PRES_VEH_MARCA_X_MM', 20) * MM_TO_PX;
const PRES_VEH_MARCA_Y = numEnv('PRES_VEH_MARCA_Y_MM', 95) * MM_TO_PX;
const PRES_VEH_MODELO_X = numEnv('PRES_VEH_MODELO_X_MM', 20) * MM_TO_PX;
const PRES_VEH_MODELO_Y = numEnv('PRES_VEH_MODELO_Y_MM', 100) * MM_TO_PX;
const PRES_TIPO_INF_X = numEnv('PRES_TIPO_INF_X_MM', 20) * MM_TO_PX;
const PRES_TIPO_INF_Y = numEnv('PRES_TIPO_INF_Y_MM', 110) * MM_TO_PX;
const PRES_LUGAR_X = numEnv('PRES_LUGAR_X_MM', 20) * MM_TO_PX;
const PRES_LUGAR_Y = numEnv('PRES_LUGAR_Y_MM', 115) * MM_TO_PX;
const PRES_VEL_MEDIDA_X = numEnv('PRES_VEL_MEDIDA_X_MM', 20) * MM_TO_PX;
const PRES_VEL_MEDIDA_Y = numEnv('PRES_VEL_MEDIDA_Y_MM', 125) * MM_TO_PX;
const PRES_VEL_LIMITE_X = numEnv('PRES_VEL_LIMITE_X_MM', 60) * MM_TO_PX;
const PRES_VEL_LIMITE_Y = numEnv('PRES_VEL_LIMITE_Y_MM', 125) * MM_TO_PX;
const PRES_CINE_MARCA_X = numEnv('PRES_CINE_MARCA_X_MM', 20) * MM_TO_PX;
const PRES_CINE_MARCA_Y = numEnv('PRES_CINE_MARCA_Y_MM', 140) * MM_TO_PX;
const PRES_CINE_MODELO_X = numEnv('PRES_CINE_MODELO_X_MM', 20) * MM_TO_PX;
const PRES_CINE_MODELO_Y = numEnv('PRES_CINE_MODELO_Y_MM', 145) * MM_TO_PX;
const PRES_CINE_SERIE_X = numEnv('PRES_CINE_SERIE_X_MM', 20) * MM_TO_PX;
const PRES_CINE_SERIE_Y = numEnv('PRES_CINE_SERIE_Y_MM', 150) * MM_TO_PX;
const PRES_CINE_APROB_X = numEnv('PRES_CINE_APROB_X_MM', 20) * MM_TO_PX;
const PRES_CINE_APROB_Y = numEnv('PRES_CINE_APROB_Y_MM', 155) * MM_TO_PX;
const PRES_REMITIDO_A_X = numEnv('PRES_REMITIDO_A_X_MM', 20) * MM_TO_PX;
const PRES_REMITIDO_A_Y = numEnv('PRES_REMITIDO_A_Y_MM', 160) * MM_TO_PX;
const PRES_OBSERVACIONES_X = numEnv('PRES_OBSERVACIONES_X_MM', 20) * MM_TO_PX;
const PRES_OBSERVACIONES_Y = numEnv('PRES_OBSERVACIONES_Y_MM', 165) * MM_TO_PX;
const DEBUG_GRID = process.env.PRES_DEBUG_GRID === 'true';
let ActasPresencialesService = class ActasPresencialesService {
    constructor(db) {
        this.db = db;
    }
    async ensureDirs() {
        await fs.mkdir(PNG_DIR, { recursive: true }).catch(() => { });
    }
    async createPresencial(payload) {
        if (!this.db)
            throw new Error('DB pool no inyectado');
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            const serie = payload.serie || 'P';
            const tipoInfraccion = payload.tipo_infraccion || 'Exceso de velocidad';
            const up = await client.query('UPDATE correlativos SET ultimo = ultimo + 1 WHERE serie = $1 RETURNING ultimo', [serie]);
            const n = up.rows[0]?.ultimo ?? 1;
            const ins = await client.query(`INSERT INTO actas_presenciales (
          serie, nro_correlativo, dominio, tipo_infraccion, fecha_acta,
          conductor_nombre, conductor_dni, conductor_domicilio,
          conductor_licencia, conductor_licencia_clase, conductor_cp, conductor_departamento, conductor_provincia,
          veh_tipo, veh_marca, veh_modelo,
          titular_nombre, titular_dni_cuit, titular_domicilio,
          titular_cp, titular_departamento, titular_provincia,
          cine_marca, cine_modelo, cine_serie, cine_aprobacion,
          velocidad_medida, velocidad_limite,
          observaciones, lugar_infraccion, remitido_a,
          estado, notificado, fecha_notificacion
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,
          $9,$10,$11,$12,$13,
          $14,$15,$16,
          $17,$18,$19,
          $20,$21,$22,
          $23,$24,$25,$26,
          $27,$28,
          $29,$30,$31,
          $32,$33,$34
        )
        RETURNING id, serie, nro_correlativo`, [
                serie,
                n,
                (payload.dominio || '').toUpperCase(),
                tipoInfraccion,
                payload.fecha_acta || new Date(),
                payload.infractor_nombre || null,
                payload.infractor_dni || null,
                payload.infractor_domicilio || null,
                payload.infractor_licencia || null,
                payload.infractor_licencia_clase || null,
                payload.infractor_cp || null,
                payload.infractor_departamento || null,
                payload.infractor_provincia || null,
                payload.tipo_vehiculo || null,
                payload.marca || null,
                payload.modelo || null,
                payload.titular_nombre || null,
                payload.titular_dni || null,
                payload.titular_domicilio || null,
                payload.titular_cp || null,
                payload.titular_departamento || null,
                payload.titular_provincia || null,
                payload.cineMarca || null,
                payload.cineModelo || null,
                payload.cineSerie || null,
                payload.cineAprobacion || null,
                payload.velocidad_medida || null,
                payload.velocidad_limite || null,
                payload.observaciones || null,
                payload.lugar_infraccion || null,
                payload.remitido_a || null,
                'notificada',
                true,
                payload.fecha_acta || new Date(),
            ]);
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
        }
        catch (e) {
            await client.query('ROLLBACK').catch(() => { });
            const errMsg = e instanceof Error ? e.message : JSON.stringify(e);
            log.error(`Error al crear acta presencial: ${errMsg}`);
            throw e;
        }
        finally {
            client.release();
        }
    }
    async buildTicketBytesFromInfraccion(id) {
        if (!this.db)
            throw new Error('DB pool no inyectado');
        const r = await this.db.query(`SELECT
         i.id, i.serie, i.nro_correlativo, i.dominio, i.fecha_acta, i.tipo_infraccion,
         i.veh_tipo, i.veh_marca, i.veh_modelo,
         i.conductor_nombre, i.conductor_dni, i.conductor_domicilio, i.conductor_licencia, i.conductor_licencia_clase,
         i.conductor_cp, i.conductor_departamento, i.conductor_provincia,
         i.cine_marca, i.cine_modelo, i.cine_serie, i.cine_aprobacion,
         i.velocidad_medida, i.velocidad_limite, i.lugar_infraccion, i.remitido_a, i.observaciones,
         t.nombre AS titular_nombre, t.dni AS titular_dni, t.domicilio AS titular_domicilio,
         t.cp AS titular_cp, t.departamento AS titular_departamento, t.provincia AS titular_provincia
       FROM actas_presenciales i
       LEFT JOIN titulares t ON t.dominio = i.dominio
       WHERE i.id = $1`, [id]);
        const row = r.rows[0];
        if (!row)
            throw new Error('Acta no encontrada');
        const nroActa = `${row.serie}-${String(row.nro_correlativo).padStart(7, '0')}`;
        const payload = {
            nroActa,
            fechaActa: row.fecha_acta || new Date(),
            dominio: row.dominio,
            tipoInfraccion: row.tipo_infraccion,
            conductorNombre: row.conductor_nombre,
            conductorDni: row.conductor_dni,
            conductorDomicilio: row.conductor_domicilio,
            conductorLicencia: row.conductor_licencia,
            conductorLicenciaClase: row.conductor_licencia_clase,
            conductorCp: row.conductor_cp,
            conductorDepartamento: row.conductor_departamento,
            conductorProvincia: row.conductor_provincia,
            vehTipo: row.veh_tipo,
            vehMarca: row.veh_marca,
            vehModelo: row.veh_modelo,
            cineMarca: row.cine_marca,
            cineModelo: row.cine_modelo,
            cineSerie: row.cine_serie,
            cineAprobacion: row.cine_aprobacion,
            velocidadMedida: row.velocidad_medida,
            velocidadLimite: row.velocidad_limite,
            lugarInfraccion: row.lugar_infraccion,
            remitidoA: row.remitido_a,
            observaciones: row.observaciones,
            titularNombre: row.titular_nombre,
            titularDni: row.titular_dni,
            titularDomicilio: row.titular_domicilio,
            titularCp: row.titular_cp,
            titularDepartamento: row.titular_departamento,
            titularProvincia: row.titular_provincia,
        };
        const bytes = await this.buildTicketBytes(payload);
        const filename = `PRES-${nroActa}.png`;
        return { bytes, filename };
    }
    async buildTicketBytes(payload) {
        let templateBuffer;
        try {
            templateBuffer = await fs.readFile(TPL_PNG);
            log.log(`Template cargado desde ${TPL_PNG}`);
        }
        catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            log.error(`Template PNG no encontrado en ${TPL_PNG}: ${errMsg}`);
            throw new Error(`Template PNG no disponible: ${errMsg}`);
        }
        const f = dayjs(payload.fechaActa).format('DD/MM/YYYY');
        const h = dayjs(payload.fechaActa).format('HH:mm');
        const textElements = [
            { text: payload.nroActa || '', x: PRES_ACTA_X, y: PRES_ACTA_Y, bold: true, size: 12 },
            { text: f, x: PRES_FECHA_X, y: PRES_FECHA_Y, bold: true, size: 12 },
            { text: payload.dominio || '', x: PRES_DOMINIO_X, y: PRES_DOMINIO_Y, bold: true, size: 12 },
            { text: payload.conductorNombre || '', x: PRES_CONDUCTOR_NOMBRE_X, y: PRES_CONDUCTOR_NOMBRE_Y, bold: true, size: 12 },
            { text: payload.conductorDni || '', x: PRES_CONDUCTOR_DNI_X, y: PRES_CONDUCTOR_DNI_Y, bold: true, size: 12 },
            { text: payload.conductorDomicilio || '', x: PRES_CONDUCTOR_DOM_X, y: PRES_CONDUCTOR_DOM_Y, bold: true, size: 12 },
            { text: payload.conductorLicencia || '', x: PRES_CONDUCTOR_LIC_NRO_X, y: PRES_CONDUCTOR_LIC_NRO_Y, bold: true, size: 12 },
            { text: payload.conductorLicenciaClase || '', x: PRES_CONDUCTOR_LIC_CLASE_X, y: PRES_CONDUCTOR_LIC_CLASE_Y, bold: true, size: 12 },
            { text: payload.conductorDepartamento || '', x: PRES_CONDUCTOR_DEPTO_X, y: PRES_CONDUCTOR_DEPTO_Y, bold: true, size: 12 },
            { text: payload.conductorProvincia || '', x: PRES_CONDUCTOR_PROV_X, y: PRES_CONDUCTOR_PROV_Y, bold: true, size: 12 },
            { text: payload.titularNombre || '', x: PRES_TITULAR_NOMBRE_X, y: PRES_TITULAR_NOMBRE_Y, bold: true, size: 12 },
            { text: payload.titularDni || '', x: PRES_TITULAR_DNI_X, y: PRES_TITULAR_DNI_Y, bold: true, size: 12 },
            { text: payload.titularDomicilio || '', x: PRES_TITULAR_DOMICILIO_X, y: PRES_TITULAR_DOMICILIO_Y, bold: true, size: 12 },
            { text: payload.titularCp || '', x: PRES_TITULAR_CP_X, y: PRES_TITULAR_CP_Y, bold: true, size: 12 },
            { text: payload.titularDepartamento || '', x: PRES_TITULAR_DEPTO_X, y: PRES_TITULAR_DEPTO_Y, bold: true, size: 12 },
            { text: payload.titularProvincia || '', x: PRES_TITULAR_PROV_X, y: PRES_TITULAR_PROV_Y, bold: true, size: 12 },
            { text: payload.vehTipo || '', x: PRES_VEH_TIPO_X, y: PRES_VEH_TIPO_Y, bold: true, size: 12 },
            { text: payload.vehMarca || '', x: PRES_VEH_MARCA_X, y: PRES_VEH_MARCA_Y, bold: true, size: 12 },
            { text: payload.vehModelo || '', x: PRES_VEH_MODELO_X, y: PRES_VEH_MODELO_Y, bold: true, size: 12 },
            { text: payload.velocidadMedida ? `${payload.velocidadMedida} km/h` : '', x: PRES_VEL_MEDIDA_X, y: PRES_VEL_MEDIDA_Y, bold: true, size: 12 },
            { text: payload.cineMarca || '', x: PRES_CINE_MARCA_X, y: PRES_CINE_MARCA_Y, bold: true, size: 12 },
            { text: payload.cineModelo || '', x: PRES_CINE_MODELO_X, y: PRES_CINE_MODELO_Y, bold: true, size: 12 },
            { text: payload.cineSerie || '', x: PRES_CINE_SERIE_X, y: PRES_CINE_SERIE_Y, bold: true, size: 12 },
            { text: payload.cineAprobacion || '', x: PRES_CINE_APROB_X, y: PRES_CINE_APROB_Y, bold: true, size: 12 },
            { text: payload.remitidoA || '', x: PRES_REMITIDO_A_X, y: PRES_REMITIDO_A_Y, bold: true, size: 12 },
            { text: payload.observaciones || '', x: PRES_OBSERVACIONES_X, y: PRES_OBSERVACIONES_Y, bold: true, size: 12 },
        ];
        const svgTexts = textElements
            .filter(el => el.text)
            .map(el => {
            const weight = el.bold ? 'bold' : 'normal';
            return `<text x="${el.x}" y="${el.y}" font-family="DejaVu Sans, sans-serif" font-size="${el.size}px" font-weight="${weight}" fill="black">${this.escapeXml(el.text)}</text>`;
        })
            .join('\n    ');
        const svgOverlay = `
<svg width="${IMG_WIDTH}" height="${IMG_HEIGHT}">
  <rect width="${IMG_WIDTH}" height="${IMG_HEIGHT}" fill="none"/>
  ${svgTexts}
</svg>`;
        const imageBuffer = await sharp(templateBuffer)
            .composite([
            {
                input: Buffer.from(svgOverlay),
                top: 0,
                left: 0,
            },
        ])
            .png({ compressionLevel: 9, palette: true })
            .withMetadata({ density: IMG_DPI })
            .toBuffer();
        log.log(`PNG generado: ${imageBuffer.length} bytes`);
        return imageBuffer;
    }
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    async saveTicket(payload) {
        await this.ensureDirs();
        const bytes = await this.buildTicketBytes(payload);
        const filename = `PRES-${payload.nroActa}.png`;
        const outPath = path.join(PNG_DIR, filename);
        await fs.writeFile(outPath, bytes);
        log.log(`PNG guardado en ${outPath} (${bytes.length} bytes)`);
        return { filename, png_path: outPath, bytes };
    }
};
ActasPresencialesService = __decorate([
    Injectable(),
    __param(0, Inject('PG')),
    __metadata("design:paramtypes", [Pool])
], ActasPresencialesService);
export { ActasPresencialesService };
