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
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseCameraTxt } from './parse-camera-txt.js';
import { NotificacionesService } from '../notificaciones/notificaciones.service.js';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';
let InfraccionesService = class InfraccionesService {
    constructor(db, notifs) {
        this.db = db;
        this.notifs = notifs;
        this.log = new Logger('InfraccionesService');
    }
    async extract(body) {
        let ocr = {};
        let anpr = {};
        if (body.txtFileId) {
            const p = path.join(UPLOAD_DIR, body.txtFileId);
            try {
                const content = await fs.readFile(p, 'utf8');
                const parsed = parseCameraTxt(content);
                ocr = { ...parsed };
            }
            catch { }
        }
        const archivos = [
            ...(body.imageFileId ? [{ tipo: 'imagen', fileId: body.imageFileId, url: `s3://sv/${body.imageFileId}` }] : []),
            ...(body.txtFileId ? [{ tipo: 'txt', fileId: body.txtFileId, url: `s3://sv/${body.txtFileId}` }] : []),
        ];
        return { ocr, anpr, archivos };
    }
    async create(dto) {
        this.log.debug('=== CREATE INFRACCION - DTO RECEIVED ===');
        this.log.debug(JSON.stringify(dto, null, 2));
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            const serie = 'A';
            const vMed = Number(dto.velocidad_medida) || 0;
            const vAut = dto.velocidad_autorizada !== undefined ? Number(dto.velocidad_autorizada) || 0 : 0;
            const ins = await client.query(`INSERT INTO infracciones(
           serie, dominio, tipo_infraccion, fecha_labrado, fecha_notificacion,
           velocidad_medida, velocidad_autorizada, ubicacion_texto, lat, lng,
           foto_file_id, cam_serie, tipo_vehiculo, vehiculo_marca, vehiculo_modelo,
           emision_texto, arteria, estado,
           conductor_nombre, conductor_dni, conductor_domicilio, conductor_licencia,
           conductor_licencia_clase, conductor_cp, conductor_departamento, conductor_provincia,
           titular_nombre, titular_dni_cuit, titular_domicilio,
           titular_cp, titular_departamento, titular_provincia
         )
         VALUES(
           $1, $2, 'Exceso de velocidad', $3, $4,
           $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14,
           $15, $16, 'validada',
           $17, $18, $19, $20,
           $21, $22, $23, $24,
           $25, $26, $27,
           $28, $29, $30
         )
         RETURNING id`, [
                serie,
                dto.dominio, dto.fecha_labrado, dto.fecha_notificacion || null,
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
                dto.conductor_nombre || null,
                dto.conductor_dni || null,
                dto.conductor_domicilio || null,
                dto.conductor_licencia || null,
                dto.conductor_licencia_clase || null,
                dto.conductor_cp || null,
                dto.conductor_departamento || null,
                dto.conductor_provincia || null,
                dto.titular_nombre || null,
                dto.titular_dni_cuit || null,
                dto.titular_domicilio || null,
                dto.titular_cp || null,
                dto.titular_departamento || null,
                dto.titular_provincia || null,
            ]);
            const row = ins.rows[0];
            await client.query('COMMIT');
            const res = await this.db.query(`SELECT id, nro_acta, fecha_labrado, fecha_carga, dominio, velocidad_medida, velocidad_autorizada, estado
           FROM v_infracciones
          WHERE id=$1`, [row.id]);
            const acta = res.rows[0];
            try {
                if (this.notifs?.generarPdf) {
                    await this.notifs.generarPdf(acta.id);
                }
                else {
                    this.log.warn('NotificacionesService no disponible; se omite autogeneración de PDF.');
                }
            }
            catch (e) {
                this.log.warn(`Acta ${acta.id} guardada pero falló la autogeneración de PDF: ${e?.message || e}`);
            }
            return acta;
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async list(q) {
        const where = [];
        const params = [];
        const push = (cl, v) => { params.push(v); where.push(cl.replace('$X', `$${params.length}`)); };
        if (q.dominio)
            push('i.dominio=$X', q.dominio.toUpperCase());
        if (q.acta)
            push('i.nro_acta=$X', q.acta);
        if (q.estado)
            push('i.estado=$X', q.estado);
        const sqlWhere = where.length ? 'WHERE ' + where.join(' AND ') : '';
        const rows = await this.db.query(`SELECT id, nro_acta, dominio, fecha_labrado, fecha_carga,
              velocidad_medida, velocidad_autorizada, estado
         FROM v_infracciones i
         ${sqlWhere}
        ORDER BY fecha_labrado DESC
        LIMIT 200`, params);
        return { page: 1, pageSize: rows.rows.length, total: rows.rows.length, items: rows.rows };
    }
    async getOne(id) {
        const r = await this.db.query(`SELECT * FROM v_infracciones WHERE id=$1`, [id]);
        return r.rows[0];
    }
    async patch(id, dto) {
        const sets = [];
        const params = [];
        const push = (s, v) => { params.push(v); sets.push(s.replace('$X', `$${params.length}`)); };
        if (dto.ubicacion_texto !== undefined)
            push('ubicacion_texto=$X', dto.ubicacion_texto);
        if (dto.velocidad_medida !== undefined)
            push('velocidad_medida=$X', Number(dto.velocidad_medida) || 0);
        if (dto.velocidad_autorizada !== undefined)
            push('velocidad_autorizada=$X', Number(dto.velocidad_autorizada) || 0);
        if (dto.estado !== undefined)
            push('estado=$X', dto.estado);
        if (dto.fecha_notificacion !== undefined)
            push('fecha_notificacion=$X', dto.fecha_notificacion);
        if (dto.cam_serie !== undefined)
            push('cam_serie=$X', dto.cam_serie);
        if (dto.tipo_vehiculo !== undefined)
            push('tipo_vehiculo=$X', dto.tipo_vehiculo);
        if (dto.vehiculo_marca !== undefined)
            push('vehiculo_marca=$X', dto.vehiculo_marca);
        if (dto.vehiculo_modelo !== undefined)
            push('vehiculo_modelo=$X', dto.vehiculo_modelo);
        if (dto.arteria !== undefined)
            push('arteria=$X', dto.arteria);
        if (dto.emision_texto !== undefined)
            push('emision_texto=$X', dto.emision_texto);
        if (dto.conductor_nombre !== undefined)
            push('conductor_nombre=$X', dto.conductor_nombre);
        if (dto.conductor_dni !== undefined)
            push('conductor_dni=$X', dto.conductor_dni);
        if (dto.conductor_domicilio !== undefined)
            push('conductor_domicilio=$X', dto.conductor_domicilio);
        if (dto.conductor_licencia !== undefined)
            push('conductor_licencia=$X', dto.conductor_licencia);
        if (dto.conductor_licencia_clase !== undefined)
            push('conductor_licencia_clase=$X', dto.conductor_licencia_clase);
        if (dto.conductor_cp !== undefined)
            push('conductor_cp=$X', dto.conductor_cp);
        if (dto.conductor_departamento !== undefined)
            push('conductor_departamento=$X', dto.conductor_departamento);
        if (dto.conductor_provincia !== undefined)
            push('conductor_provincia=$X', dto.conductor_provincia);
        if (dto.titular_nombre !== undefined)
            push('titular_nombre=$X', dto.titular_nombre);
        if (dto.titular_dni_cuit !== undefined)
            push('titular_dni_cuit=$X', dto.titular_dni_cuit);
        if (dto.titular_domicilio !== undefined)
            push('titular_domicilio=$X', dto.titular_domicilio);
        if (dto.titular_cp !== undefined)
            push('titular_cp=$X', dto.titular_cp);
        if (dto.titular_departamento !== undefined)
            push('titular_departamento=$X', dto.titular_departamento);
        if (dto.titular_provincia !== undefined)
            push('titular_provincia=$X', dto.titular_provincia);
        if (!sets.length)
            return { ok: true };
        await this.db.query(`UPDATE infracciones SET ${sets.join(', ')} WHERE id=$${params.length + 1}`, [...params, id]);
        return { ok: true };
    }
};
InfraccionesService = __decorate([
    Injectable(),
    __param(0, Inject('PG')),
    __param(1, Optional()),
    __metadata("design:paramtypes", [Pool,
        NotificacionesService])
], InfraccionesService);
export { InfraccionesService };
