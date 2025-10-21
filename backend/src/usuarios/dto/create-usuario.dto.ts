// src/usuarios/dto/create-usuario.dto.ts

import { IsEmail, IsString, IsIn, IsBoolean, IsOptional, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsIn(['dev', 'admin', 'agente'], { message: 'Rol debe ser: dev, admin o agente' })
  rol!: 'dev' | 'admin' | 'agente';

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
