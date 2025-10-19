import { Module } from '@nestjs/common';
import { InfraccionesController } from './infracciones.controller.js';
import { InfraccionesService } from './infracciones.service.js';
import { DatabaseModule } from '../db/database.module.js';                 // 👈 PG provider
import { NotificacionesModule } from '../notificaciones/notificaciones.module.js'; // 👈 trae NotificacionesService

@Module({
  imports: [DatabaseModule, NotificacionesModule], // 👈 habilita DI de PG y NotificacionesService
  controllers: [InfraccionesController],
  providers: [InfraccionesService],
})
export class InfraccionesModule {}
