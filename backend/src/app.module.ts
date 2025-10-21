import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { InfraccionesModule } from './infracciones/infracciones.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { DatabaseModule } from './db/database.module.js';
import { TitularesModule } from './titulares/titulares.module.js';
import { NotificacionesModule } from './notificaciones/notificaciones.module.js';
import { HealthModule } from './health/health.module.js';
import { ActasPresencialesModule } from './presencial/actas-presenciales.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';


@Module({
  imports: [DatabaseModule, AuthModule, UploadsModule, InfraccionesModule,
    TitularesModule, NotificacionesModule, HealthModule, ActasPresencialesModule, UsuariosModule, DashboardModule],
})
export class AppModule {}
