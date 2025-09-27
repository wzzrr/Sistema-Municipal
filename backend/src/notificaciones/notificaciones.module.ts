import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';     // 👈 .js
import { NotificacionesController } from './notificaciones.controller.js';// 👈 .js
import { DatabaseModule } from '../db/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [NotificacionesService],
  controllers: [NotificacionesController],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
