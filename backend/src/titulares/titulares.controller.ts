import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TitularesService } from './titulares.service.js';
import { JwtAuthGuard } from '../common/jwt.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('titulares')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TitularesController {
  constructor(private readonly svc: TitularesService) {}

  @Get(':dominio')
  @Roles('operador', 'admin', 'auditor')
  async byDominio(@Param('dominio') dominio: string) {
    return this.svc.byDominio(dominio);
  }
}
