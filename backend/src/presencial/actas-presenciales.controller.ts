// src/presencial/actas-presenciales.controller.ts
import { Body, Controller, Get, Param, Post, Res, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import dayjs from 'dayjs';
import { ActasPresencialesService } from './actas-presenciales.service.js';

@Controller('presencial')
export class ActasPresencialesController {
  constructor(private readonly service: ActasPresencialesService) {}

  /** POST /api/presencial
   *  Guarda la acta presencial en DB y devuelve id + nro_acta
   */
  @Post()
  async create(@Body() payload: any) {
    const result = await this.service.createPresencial(payload);
    return result;
  }

  /** POST /api/presencial/ticket
   *  Genera ticket PNG desde payload y lo guarda en disco.
   */
  @Post('ticket')
  async generarTicket(@Body() payload: any) {
    const fecha = payload.fechaActa ? dayjs(payload.fechaActa).toDate() : new Date();
    const result = await this.service.saveTicket({
      ...payload,
      fechaActa: fecha,
    });
    return {
      ok: true,
      message: 'Ticket PNG generado correctamente',
      file: result.filename,
      path: result.png_path,
    };
  }

  /** GET /api/presencial/:id/ticket
   *  Genera/stream del ticket PNG a partir de la infraccion guardada (responde image/png)
   */
  @Get(':id/ticket')
  async ticketById(@Param('id') id: string, @Res() res: Response) {
    const infId = Number(id);
    if (!Number.isFinite(infId)) return res.status(HttpStatus.BAD_REQUEST).json({ error: 'id inválido' });

    const { bytes, filename } = await this.service.buildTicketBytesFromInfraccion(infId);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.status(200).send(Buffer.from(bytes));
  }
}
