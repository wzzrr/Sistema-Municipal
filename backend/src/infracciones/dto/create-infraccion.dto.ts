import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInfraccionDto {
  @IsString() dominio!: string;
  @IsISO8601() fecha_labrado!: string;
  @IsISO8601() @IsOptional() fecha_notificacion?: string;

  @IsNumber() velocidad_medida!: number;

  @IsString() ubicacion_texto!: string;
  @IsNumber() @IsOptional() lat?: number;
  @IsNumber() @IsOptional() lng?: number;

  @IsString() @IsOptional() foto_file_id?: string;

  // 👇 nuevos
  @IsString() @IsOptional() tipo_vehiculo?: string;
  @IsString() @IsOptional() vehiculo_marca?: string;
  @IsString() @IsOptional() vehiculo_modelo?: string;

  @IsString() @IsOptional() cam_serie?: string;

  @IsOptional() @IsString() emision_texto?: string;
  @IsOptional() @IsString() arteria?: string;

  // Conductor/Infractor
  @IsOptional() @IsString() conductor_nombre?: string;
  @IsOptional() @IsString() conductor_dni?: string;
  @IsOptional() @IsString() conductor_domicilio?: string;
  @IsOptional() @IsString() conductor_licencia?: string;
  @IsOptional() @IsString() conductor_licencia_clase?: string;
  @IsOptional() @IsString() conductor_cp?: string;
  @IsOptional() @IsString() conductor_departamento?: string;
  @IsOptional() @IsString() conductor_provincia?: string;

  // Titular
  @IsOptional() @IsString() titular_nombre?: string;
  @IsOptional() @IsString() titular_dni_cuit?: string;
  @IsOptional() @IsString() titular_domicilio?: string;
  @IsOptional() @IsString() titular_cp?: string;
  @IsOptional() @IsString() titular_departamento?: string;
  @IsOptional() @IsString() titular_provincia?: string;
}
