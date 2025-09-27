// backend/src/infracciones/infracciones.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { InfraccionesService } from './infracciones.service.js';
import { CreateInfraccionDto } from './dto/create-infraccion.dto.js';

@Controller('infracciones') // recuerda: tenés app.setGlobalPrefix('api'), así que aquí podría ser solo 'infracciones'
export class InfraccionesController {
  constructor(private readonly service: InfraccionesService) {}

  @Post('extract')
  async extract(@Body() body: { imageFileId?: string; txtFileId?: string }) {
    // Extrae SOLO desde TXT (según lo que dejaste)
    return this.service.extract(body);
  }

  @Post()
  async create(@Body() dto: CreateInfraccionDto) {
    // ✅ Acá el ValidationPipe con whitelist va a mantener SÓLO lo definido en el DTO
    // Asegurate de que 'cam_serie' esté en tu DTO; si no, se elimina.
    // TIP (temporal): console.log(dto) para ver lo que llega.
    return this.service.create(dto);
  }

  @Get()
  async list(@Query() q: any) {
    return this.service.list(q);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.getOne(Number(id));
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: any) {
    return this.service.patch(Number(id), dto);
  }
}
