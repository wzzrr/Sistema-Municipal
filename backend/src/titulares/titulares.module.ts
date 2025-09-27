import { Module } from '@nestjs/common';
import { TitularesController } from './titulares.controller.js';
import { TitularesService } from './titulares.service.js';

@Module({ controllers: [TitularesController], providers: [TitularesService] })
export class TitularesModule {}
