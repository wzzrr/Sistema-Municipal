import { Controller, Get, Head } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  get() {
    return {
      ok: true,
      uptime: Math.round(process.uptime()),
      env: process.env.NODE_ENV ?? 'development',
    };
  }

  // opcional: soporte HEAD (útil para probes rápidos)
  @Head()
  head() {
    return;
  }
}
