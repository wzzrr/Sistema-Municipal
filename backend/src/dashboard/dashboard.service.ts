// backend/src/dashboard/dashboard.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DashboardService {
  constructor(@Inject('PG') private readonly db: Pool) {}

  /**
   * Obtener estadísticas generales del sistema
   */
  async getStats() {
    const [
      totalResult,
      validadasResult,
      notificadasResult,
      hoyResult,
      semanaResult,
    ] = await Promise.all([
      // Total de infracciones
      this.db.query('SELECT COUNT(*) as total FROM infracciones'),

      // Infracciones validadas
      this.db.query("SELECT COUNT(*) as total FROM infracciones WHERE estado = 'validada'"),

      // Infracciones notificadas
      this.db.query("SELECT COUNT(*) as total FROM infracciones WHERE notificado = TRUE"),

      // Infracciones de hoy
      this.db.query(`
        SELECT COUNT(*) as total
        FROM infracciones
        WHERE DATE(fecha_carga) = CURRENT_DATE
      `),

      // Infracciones de la última semana
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

  /**
   * Obtener últimas infracciones con todos los campos
   */
  async getRecentInfracciones(limit: number = 10) {
    const { rows } = await this.db.query(
      `SELECT
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
       LIMIT $1`,
      [limit]
    );

    return rows;
  }

  /**
   * Estadísticas por estado
   */
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

  /**
   * Estadísticas de velocidad (promedio, máxima, etc.)
   */
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

  /**
   * Top arterias con más infracciones
   */
  async getTopArterias(limit: number = 5) {
    const { rows } = await this.db.query(
      `SELECT
        arteria,
        COUNT(*) as cantidad
       FROM infracciones
       WHERE arteria IS NOT NULL AND arteria != ''
       GROUP BY arteria
       ORDER BY cantidad DESC
       LIMIT $1`,
      [limit]
    );

    return rows;
  }
}
