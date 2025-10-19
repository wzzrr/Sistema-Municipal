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
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
};
__decorate([
    Post(),
    UseInterceptors(FileInterceptor('file')),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "upload", null);
UploadsController = __decorate([
    Controller('uploads')
], UploadsController);
export { UploadsController };
