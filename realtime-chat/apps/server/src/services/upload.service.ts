import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../utils/logger.js';
import { AttachmentDto } from '@realtime-chat/shared';

// Dangerous file extensions to reject unconditionally
const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.msi',
  '.scr',
  '.pif',
  '.com',
  '.jar',
  '.app',
]);

const DANGEROUS_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
  'application/x-msdos-program',
]);

export class UploadService {
  private s3Client: S3Client | null = null;
  private localUploadDir: string;

  constructor() {
    this.localUploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      try {
        fs.mkdirSync(this.localUploadDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, 'Failed to create local uploads directory');
      }
    }

    try {
      this.s3Client = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY,
          secretAccessKey: env.S3_SECRET_KEY,
        },
        forcePathStyle: env.S3_FORCE_PATH_STYLE,
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to initialize S3 client, using local file store fallback');
    }
  }

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    conversationId?: string,
  ): Promise<AttachmentDto> {
    if (!file || !file.buffer) {
      throw AppError.badRequest('No file uploaded');
    }

    if (file.size > env.MAX_UPLOAD_SIZE_BYTES) {
      throw AppError.badRequest(
        `File size exceeds limit of ${env.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }

    // 1. Sanitize filename
    const originalName = file.originalname || 'upload';
    const ext = path.extname(originalName).toLowerCase();

    if (DANGEROUS_EXTENSIONS.has(ext)) {
      throw AppError.badRequest('Executable and script file uploads are forbidden for security');
    }

    const baseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);
    const safeFilename = `${baseName || 'file'}${ext}`;

    // 2. Sniff magic numbers to determine true MIME type
    const sniffedType = await fileTypeFromBuffer(file.buffer);
    let mimeType = sniffedType ? sniffedType.mime : file.mimetype || 'application/octet-stream';

    if (DANGEROUS_MIME_TYPES.has(mimeType)) {
      throw AppError.badRequest('File type rejected: dangerous executable content detected');
    }

    // 3. Generate unique storage key
    const fileId = uuidv4();
    const s3Key = `attachments/${fileId}-${safeFilename}`;

    // 4. Save to S3 or Local Fallback
    let savedToS3 = false;
    if (this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: s3Key,
            Body: file.buffer,
            ContentType: mimeType,
          }),
        );
        savedToS3 = true;
      } catch (err) {
        logger.warn({ err, s3Key }, 'S3 upload failed, falling back to local disk storage');
      }
    }

    if (!savedToS3) {
      const localPath = path.join(this.localUploadDir, `${fileId}-${safeFilename}`);
      await fs.promises.writeFile(localPath, file.buffer);
    }

    // 5. Create database record
    const attachment = await prisma.attachment.create({
      data: {
        id: fileId,
        uploaderId: userId,
        conversationId: conversationId || null,
        fileName: safeFilename,
        fileSize: file.size,
        mimeType,
        s3Key,
        thumbnailKey: null,
      },
    });

    return this.formatAttachmentDto(attachment);
  }

  async getFileStream(
    attachmentId: string,
    userId: string,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        conversation: {
          include: { memberships: true },
        },
      },
    });

    if (!attachment) {
      throw AppError.notFound('Attachment not found');
    }

    // If attached to a conversation, ensure user is a member
    if (attachment.conversationId && attachment.conversation) {
      const isMember = attachment.conversation.memberships.some((m) => m.userId === userId);
      if (!isMember) {
        throw AppError.forbidden('You do not have access to this attachment');
      }
    }

    // Try S3 first
    if (this.s3Client) {
      try {
        const s3Response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: attachment.s3Key,
          }),
        );

        if (s3Response.Body) {
          return {
            stream: s3Response.Body as NodeJS.ReadableStream,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            mimeType: attachment.mimeType,
          };
        }
      } catch (err) {
        logger.warn({ err, s3Key: attachment.s3Key }, 'S3 get failed, trying local disk');
      }
    }

    // Fallback: Check local disk storage
    const localPath = path.join(
      this.localUploadDir,
      path.basename(attachment.s3Key) || `${attachment.id}-${attachment.fileName}`,
    );

    if (fs.existsSync(localPath)) {
      return {
        stream: fs.createReadStream(localPath),
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        mimeType: attachment.mimeType,
      };
    }

    throw AppError.notFound('File content not found in storage');
  }

  formatAttachmentDto(attachment: any): AttachmentDto {
    return {
      id: attachment.id,
      messageId: attachment.messageId,
      conversationId: attachment.conversationId,
      uploaderId: attachment.uploaderId,
      fileName: attachment.fileName,
      fileSize: attachment.fileSize,
      mimeType: attachment.mimeType,
      s3Key: attachment.s3Key,
      thumbnailKey: attachment.thumbnailKey,
      url: `/api/v1/uploads/${attachment.id}`,
      createdAt: attachment.createdAt instanceof Date ? attachment.createdAt.toISOString() : attachment.createdAt,
    };
  }
}

export const uploadService = new UploadService();
