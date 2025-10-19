import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateInfraccionDto {
  @IsString() dominio!: string;
  @IsISO8601() fecha_labrado!: string;

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


}
