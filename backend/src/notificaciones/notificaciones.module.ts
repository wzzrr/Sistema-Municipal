import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';     // 👈 .js
import { NotificacionesController } from './notificaciones.controller.js';// 👈 .js
import { DatabaseModule } from '../db/database.module.js';
import { NotificacionesInternalController } from './notificaciones.internal.controller.js';

@Module({
  imports: [DatabaseModule],
  providers: [NotificacionesService],
  controllers: [NotificacionesController, NotificacionesInternalController],
  exports: [NotificacionesService], // 👈 exportamos el servicio para otros módulos
})
export class NotificacionesModule {}
