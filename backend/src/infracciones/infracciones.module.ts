import { Module } from '@nestjs/common';
import { InfraccionesController } from './infracciones.controller.js';
import { InfraccionesService } from './infracciones.service.js';

@Module({ controllers: [InfraccionesController], providers: [InfraccionesService] })
export class InfraccionesModule {}
