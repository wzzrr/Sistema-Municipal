var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import 'multer';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';
let UploadsController = class UploadsController {
    async upload(file) {
        const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const safeExt = (path.extname(file.originalname || '').toLowerCase() || '').slice(0, 8);
        const fileId = `${sha256}${safeExt}`;
        const abs = path.join(UPLOAD_DIR, fileId);
        await fs.writeFile(abs, file.buffer);
        return { fileId, path: abs, sha256, contentType: file.mimetype, size: file.size };
    }
    async uploadPair(files) {
        if (!files || files.length === 0) {
            throw new BadRequestException('Debe subir al menos 1 archivo (imagen)');
        }
        if (files.length > 2) {
            throw new BadRequestException('Máximo 2 archivos permitidos (imagen + TXT)');
        }
        const imageFile = files.find(f => f.mimetype.startsWith('image/'));
        const txtFile = files.find(f => f.mimetype === 'text/plain' ||
            f.originalname.toLowerCase().endsWith('.txt'));
        if (!imageFile) {
            throw new BadRequestException('Debe incluir al menos una imagen');
        }
        const saveFile = async (file) => {
            const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
            const safeExt = (path.extname(file.originalname || '').toLowerCase() || '').slice(0, 8);
            const fileId = `${sha256}${safeExt}`;
            const abs = path.join(UPLOAD_DIR, fileId);
            await fs.writeFile(abs, file.buffer);
            return {
                fileId,
                originalName: file.originalname,
                contentType: file.mimetype,
                size: file.size,
            };
        };
        const imageData = await saveFile(imageFile);
        const txtData = txtFile ? await saveFile(txtFile) : null;
        return {
            success: true,
            image: imageData,
            txt: txtData,
            message: txtData
                ? 'Imagen y TXT subidos correctamente'
                : 'Imagen subida correctamente (sin TXT)',
        };
    }
};
__decorate([
    Post(),
    UseInterceptors(FileInterceptor('file')),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "upload", null);
__decorate([
    Post('pair'),
    UseInterceptors(FilesInterceptor('files', 2)),
    __param(0, UploadedFiles()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadPair", null);
UploadsController = __decorate([
    Controller('uploads')
], UploadsController);
export { UploadsController };
