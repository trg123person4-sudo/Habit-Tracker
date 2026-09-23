import { Router } from 'express';
import multer from 'multer';
import { uploadController } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_BYTES,
  },
});

uploadRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  (req, res, next) => uploadController.upload(req, res, next),
);

uploadRouter.get('/:id', requireAuth, (req, res, next) =>
  uploadController.download(req, res, next),
);
