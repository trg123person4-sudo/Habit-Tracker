import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UploadService } from './upload.service.js';
import { prisma } from '../db/client.js';

describe('UploadService', () => {
  let uploadService: UploadService;

  beforeEach(() => {
    uploadService = new UploadService();
  });

  it('rejects dangerous executable files (.exe, .bat)', async () => {
    const maliciousFile: any = {
      originalname: 'virus.exe',
      buffer: Buffer.from('malicious code'),
      size: 14,
      mimetype: 'application/octet-stream',
    };

    await expect(uploadService.uploadFile('user_1', maliciousFile)).rejects.toThrow(
      'Executable and script file uploads are forbidden for security',
    );
  });

  it('rejects files exceeding maximum size', async () => {
    const hugeFile: any = {
      originalname: 'huge.png',
      buffer: Buffer.alloc(100),
      size: 30 * 1024 * 1024, // 30MB
      mimetype: 'image/png',
    };

    await expect(uploadService.uploadFile('user_1', hugeFile)).rejects.toThrow(
      'File size exceeds limit',
    );
  });

  it('uploads valid image and creates database record', async () => {
    // Valid 1x1 GIF magic bytes
    const gifBuffer = Buffer.from('47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b', 'hex');
    const validFile: any = {
      originalname: 'sample.gif',
      buffer: gifBuffer,
      size: gifBuffer.length,
      mimetype: 'image/gif',
    };

    vi.spyOn(prisma.attachment, 'create').mockImplementation(async ({ data }: any) => {
      return {
        ...data,
        createdAt: new Date(),
      };
    });

    const result = await uploadService.uploadFile('user_alice', validFile, 'conv_general');
    expect(result.fileName).toContain('sample.gif');
    expect(result.uploaderId).toBe('user_alice');
    expect(result.mimeType).toBe('image/gif');
    expect(result.url).toBe(`/api/v1/uploads/${result.id}`);
  });
});
