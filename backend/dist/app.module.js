var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { InfraccionesModule } from './infracciones/infracciones.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { DatabaseModule } from './db/database.module.js';
import { TitularesModule } from './titulares/titulares.module.js';
import { NotificacionesModule } from './notificaciones/notificaciones.module.js';
import { HealthModule } from './health/health.module.js';
import { ActasPresencialesModule } from './presencial/actas-presenciales.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [DatabaseModule, AuthModule, UploadsModule, InfraccionesModule,
            TitularesModule, NotificacionesModule, HealthModule, ActasPresencialesModule],
    })
], AppModule);
export { AppModule };
