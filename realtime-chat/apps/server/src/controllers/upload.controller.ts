import { Request, Response, NextFunction } from 'express';
import { uploadService } from '../services/upload.service.js';
import { AppError } from '../errors/app-error.js';

export class UploadController {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      if (!req.file) {
        throw AppError.badRequest('No file provided in form field "file"');
      }

      const conversationId = req.body.conversationId as string | undefined;
      const attachment = await uploadService.uploadFile(userId, req.file, conversationId);

      res.status(201).json({ attachment });
    } catch (err) {
      next(err);
    }
  }

  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { id } = req.params;
      const { stream, fileName, fileSize, mimeType } = await uploadService.getFileStream(id, userId);

      // Safe download headers
      const isImage = mimeType.startsWith('image/');
      const disposition = isImage ? 'inline' : 'attachment';
      const encodedFilename = encodeURIComponent(fileName);

      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${fileName.replace(/"/g, '')}"; filename*=UTF-8''${encodedFilename}`,
      );
      if (fileSize) {
        res.setHeader('Content-Length', fileSize);
      }
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");

      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
}

export const uploadController = new UploadController();
