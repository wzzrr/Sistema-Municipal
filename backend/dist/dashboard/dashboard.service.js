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
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
let DashboardService = class DashboardService {
    constructor(db) {
        this.db = db;
    }
    async getStats() {
        const [totalResult, validadasResult, notificadasResult, hoyResult, semanaResult,] = await Promise.all([
            this.db.query('SELECT COUNT(*) as total FROM infracciones'),
            this.db.query("SELECT COUNT(*) as total FROM infracciones WHERE estado = 'validada'"),
            this.db.query("SELECT COUNT(*) as total FROM infracciones WHERE notificado = TRUE"),
            this.db.query(`
        SELECT COUNT(*) as total
        FROM infracciones
        WHERE DATE(fecha_carga) = CURRENT_DATE
      `),
            this.db.query(`
        SELECT COUNT(*) as total
        FROM infracciones
        WHERE fecha_carga >= CURRENT_DATE - INTERVAL '7 days'
      `),
        ]);
        return {
            total: parseInt(totalResult.rows[0]?.total || '0', 10),
            validadas: parseInt(validadasResult.rows[0]?.total || '0', 10),
            notificadas: parseInt(notificadasResult.rows[0]?.total || '0', 10),
            hoy: parseInt(hoyResult.rows[0]?.total || '0', 10),
            semana: parseInt(semanaResult.rows[0]?.total || '0', 10),
        };
    }
    async getRecentInfracciones(limit = 10) {
        const { rows } = await this.db.query(`SELECT
        i.id,
        i.serie,
        i.nro_correlativo,
        (i.serie || '-' || lpad(i.nro_correlativo::text, 7, '0')) as nro_acta,
        i.dominio,
        i.tipo_infraccion,
        i.fecha_labrado,
        i.fecha_notificacion,
        i.fecha_carga,
        i.velocidad_medida,
        i.velocidad_autorizada,
        i.ubicacion_texto,
        i.arteria,
        i.lat,
        i.lng,
        i.foto_file_id,
        i.cam_serie,
        i.tipo_vehiculo,
        i.vehiculo_marca,
        i.vehiculo_modelo,
        i.estado,
        i.notificado,
        i.conductor_nombre,
        i.conductor_dni,
        i.conductor_licencia,
        i.titular_nombre,
        i.titular_dni_cuit
       FROM infracciones i
       ORDER BY i.fecha_carga DESC
       LIMIT $1`, [limit]);
        return rows;
    }
    async getStatsByEstado() {
        const { rows } = await this.db.query(`
      SELECT
        estado,
        COUNT(*) as cantidad
      FROM infracciones
      GROUP BY estado
      ORDER BY cantidad DESC
    `);
        return rows;
    }
    async getVelocidadStats() {
        const { rows } = await this.db.query(`
      SELECT
        AVG(velocidad_medida) as promedio,
        MAX(velocidad_medida) as maxima,
        MIN(velocidad_medida) as minima,
        COUNT(CASE WHEN velocidad_medida > velocidad_autorizada THEN 1 END) as excesos
      FROM infracciones
      WHERE velocidad_medida > 0
    `);
        const row = rows[0] || {};
        return {
            promedio: parseFloat(row.promedio || '0').toFixed(1),
            maxima: parseInt(row.maxima || '0', 10),
            minima: parseInt(row.minima || '0', 10),
            excesos: parseInt(row.excesos || '0', 10),
        };
    }
    async getTopArterias(limit = 5) {
        const { rows } = await this.db.query(`SELECT
        arteria,
        COUNT(*) as cantidad
       FROM infracciones
       WHERE arteria IS NOT NULL AND arteria != ''
       GROUP BY arteria
       ORDER BY cantidad DESC
       LIMIT $1`, [limit]);
        return rows;
    }
};
DashboardService = __decorate([
    Injectable(),
    __param(0, Inject('PG')),
    __metadata("design:paramtypes", [Pool])
], DashboardService);
export { DashboardService };
