import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js'; // 👈 nota el .js (ESM)

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
