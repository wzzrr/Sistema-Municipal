// src/usuarios/usuarios.module.ts

import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService], // Exportar por si otros módulos lo necesitan
})
export class UsuariosModule {}
