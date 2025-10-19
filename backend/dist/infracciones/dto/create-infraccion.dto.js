var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';
export class CreateInfraccionDto {
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "dominio", void 0);
__decorate([
    IsISO8601(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "fecha_labrado", void 0);
__decorate([
    IsNumber(),
    __metadata("design:type", Number)
], CreateInfraccionDto.prototype, "velocidad_medida", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "ubicacion_texto", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], CreateInfraccionDto.prototype, "lat", void 0);
__decorate([
    IsNumber(),
    IsOptional(),
    __metadata("design:type", Number)
], CreateInfraccionDto.prototype, "lng", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "foto_file_id", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "tipo_vehiculo", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "vehiculo_marca", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "vehiculo_modelo", void 0);
__decorate([
    IsString(),
    IsOptional(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "cam_serie", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "emision_texto", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInfraccionDto.prototype, "arteria", void 0);
