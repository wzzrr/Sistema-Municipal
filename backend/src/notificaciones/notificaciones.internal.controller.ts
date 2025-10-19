// src/notificaciones/notificaciones.internal.controller.ts
import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { InternalGuard } from '../common/internal.guard.js';

@UseGuards(InternalGuard)
@Controller('internal/notificaciones')
export class NotificacionesInternalController {
  constructor(private readonly svc: NotificacionesService) {}

  @Post(':infraccionId/pdf')
  @HttpCode(201)
  generarInterno(@Param('infraccionId') id: string) {
    return this.svc.generarPdf(Number(id));
  }
}
