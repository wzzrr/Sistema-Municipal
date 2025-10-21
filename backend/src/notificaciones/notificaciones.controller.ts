// backend/src/notificaciones/notificaciones.controller.ts
import { Body, Controller, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { InternalGuard } from '../common/internal.guard.js';
import type { Response } from 'express';

/**
 * Controller NORMAL (para el frontend de ingreso): requiere JWT + Roles
 */
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly svc: NotificacionesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':infraccionId/pdf')
  @HttpCode(201)
  @Roles('dev', 'admin', 'agente')
  generar(@Param('infraccionId') id: string) {
    return this.svc.generarPdf(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':infraccionId/pdf/stream')
  @HttpCode(200)
  @Roles('dev', 'admin', 'agente')
  async generarStream(@Param('infraccionId') id: string, @Res() res: Response) {
    const { bytes, filename } = await this.svc.generarPdfStream(Number(id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(Buffer.from(bytes));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/enviar')
  @Roles('dev', 'admin', 'agente')
  enviar(@Param('id') id: string, @Body() body: { email: string }) {
    return this.svc.enviar(Number(id), body.email);
  }
}

/**
 * Controller INTERNO (service-to-service): solo token en header X-Internal-Token
 * Ruta final: POST /api/internal/notificaciones/:infraccionId/pdf
 */
@UseGuards(InternalGuard)
@Controller('internal/notificaciones')
export class NotificacionesInternalController {
  constructor(private readonly svc: NotificacionesService) {}

  @Post(':infraccionId/pdf')
  @HttpCode(201)
  generarInternal(@Param('infraccionId') id: string) {
    return this.svc.generarPdf(Number(id));
  }
}
