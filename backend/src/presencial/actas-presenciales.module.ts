import { Module } from '@nestjs/common';
import { ActasPresencialesService } from './actas-presenciales.service.js';
import { ActasPresencialesController } from './actas-presenciales.controller.js';

@Module({
  providers: [ActasPresencialesService],
  controllers: [ActasPresencialesController],
  exports: [ActasPresencialesService],
})
export class ActasPresencialesModule {}
