// backend/src/dashboard/dashboard.controller.ts

import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/stats
   * Obtener estadísticas generales
   */
  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  /**
   * GET /api/dashboard/recent?limit=10
   * Obtener últimas infracciones
   */
  @Get('recent')
  async getRecent(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    const infracciones = await this.dashboardService.getRecentInfracciones(limit || 10);
    return { infracciones };
  }

  /**
   * GET /api/dashboard/stats-estado
   * Estadísticas por estado
   */
  @Get('stats-estado')
  async getStatsByEstado() {
    return this.dashboardService.getStatsByEstado();
  }

  /**
   * GET /api/dashboard/stats-velocidad
   * Estadísticas de velocidad
   */
  @Get('stats-velocidad')
  async getVelocidadStats() {
    return this.dashboardService.getVelocidadStats();
  }

  /**
   * GET /api/dashboard/top-arterias?limit=5
   * Top arterias con más infracciones
   */
  @Get('top-arterias')
  async getTopArterias(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.dashboardService.getTopArterias(limit || 5);
  }
}
