// src/usuarios/dto/update-usuario.dto.ts

import { IsEmail, IsString, IsIn, IsBoolean, IsOptional } from 'class-validator';

export class UpdateUsuarioDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsIn(['dev', 'admin', 'agente'], { message: 'Rol debe ser: dev, admin o agente' })
  @IsOptional()
  rol?: 'dev' | 'admin' | 'agente';

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
