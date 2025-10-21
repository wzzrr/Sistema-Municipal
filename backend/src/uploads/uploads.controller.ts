import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

  /**
   * POST /api/uploads/pair
   * Sube múltiples archivos (imagen + TXT) en una sola operación.
   * Valida que sean una pareja válida: 1 imagen y opcionalmente 1 TXT
   */
  @Post('pair')
  @UseInterceptors(FilesInterceptor('files', 2)) // máximo 2 archivos
  async uploadPair(@UploadedFiles() files: MulterFile[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debe subir al menos 1 archivo (imagen)');
    }

    if (files.length > 2) {
      throw new BadRequestException('Máximo 2 archivos permitidos (imagen + TXT)');
    }

    // Separar archivos por tipo
    const imageFile = files.find(f => f.mimetype.startsWith('image/'));
    const txtFile = files.find(f =>
      f.mimetype === 'text/plain' ||
      f.originalname.toLowerCase().endsWith('.txt')
    );

    // Validaciones
    if (!imageFile) {
      throw new BadRequestException('Debe incluir al menos una imagen');
    }

    // Función helper para guardar archivo
    const saveFile = async (file: MulterFile) => {
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

    // Guardar archivos
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
}
