import { Body, Controller, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';   // 👈 .js
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Response } from 'express';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificacionesController {
  constructor(private readonly svc: NotificacionesService) {}

  @Post(':infraccionId/pdf')
  @HttpCode(201)
  @Roles('operador', 'admin')
  async generar(@Param('infraccionId') id: string) {
    return this.svc.generarPdf(Number(id));
  }

  @Post(':infraccionId/pdf/stream')
  @HttpCode(200)
  @Roles('operador', 'admin')
  async generarStream(@Param('infraccionId') id: string, @Res() res: Response) {
    const { bytes, filename } = await this.svc.generarPdfStream(Number(id));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(Buffer.from(bytes));
  }

  @Post(':id/enviar')
  @Roles('operador', 'admin')
  async enviar(@Param('id') id: string, @Body() body: { email: string }) {
    return this.svc.enviar(Number(id), body.email);
  }
}
