import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';     // 👈  usamos los tipos de express
import 'multer';                    // 👈 asegura que la augmentación esté cargada

type MulterFile = Express.Multer.File;

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads'; // 👈 configurable

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: MulterFile) {   // 👈  usa el alias

    // 2) genero id y ruta
    const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const safeExt = (path.extname(file.originalname || '').toLowerCase() || '').slice(0, 8);
    const fileId = `${sha256}${safeExt}`;
    const abs = path.join(UPLOAD_DIR, fileId);

    // 3) escribo archivo
    await fs.writeFile(abs, file.buffer);

    return { fileId, path: abs, sha256, contentType: file.mimetype, size: file.size };
  }
}
