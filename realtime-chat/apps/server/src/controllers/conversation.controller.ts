import { Request, Response, NextFunction } from 'express';
import {
  createConversationSchema,
  updateConversationSchema,
  messagePaginationSchema,
} from '@realtime-chat/shared';
import { conversationService } from '../services/conversation.service.js';
import { messageService } from '../services/message.service.js';
import { AppError } from '../errors/app-error.js';

export class ConversationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const conversations = await conversationService.listForUser(req.user.userId);
      res.status(200).json({ ok: true, data: { conversations } });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = createConversationSchema.parse(req.body);
      const conversation = await conversationService.create(req.user.userId, validated);
      res.status(201).json({ ok: true, data: { conversation } });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const validated = updateConversationSchema.parse(req.body);
      const conversation = await conversationService.update(
        req.params.id,
        req.user.userId,
        validated,
      );
      res.status(200).json({ ok: true, data: { conversation } });
    } catch (err) {
      next(err);
    }
  }

  async getPublicChannels(_req: Request, res: Response, next: NextFunction) {
    try {
      const channels = await conversationService.listPublicChannels();
      res.status(200).json({ ok: true, data: { channels } });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const conversation = await conversationService.getById(req.params.id, req.user.userId);
      res.status(200).json({ ok: true, data: { conversation } });
    } catch (err) {
      next(err);
    }
  }

  async join(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const membership = await conversationService.join(req.params.id, req.user.userId);
      res.status(200).json({ ok: true, data: { membership } });
    } catch (err) {
      next(err);
    }
  }

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      await conversationService.leave(req.params.id, req.user.userId);
      res.status(200).json({ ok: true, data: { message: 'Left conversation' } });
    } catch (err) {
      next(err);
    }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const query = messagePaginationSchema.parse(req.query);
      const result = await messageService.getMessages(
        req.params.id,
        req.user.userId,
        query,
      );
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async kickMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const result = await conversationService.kickMember(
        req.params.id,
        req.user.userId,
        req.params.userId,
      );

      // Broadcast real-time socket event if IO is active
      try {
        const { getIO } = await import('../socket/index.js');
        const io = getIO();
        io.to(`conv:${req.params.id}`).emit('conversation:member_kicked', {
          conversationId: req.params.id,
          userId: req.params.userId,
        });
        io.in(`user:${req.params.userId}`).socketsLeave(`conv:${req.params.id}`);
      } catch {
        // Socket may not be initialized in non-socket tests
      }

      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async muteMember(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized();
      const duration = req.body.durationMinutes ? parseInt(req.body.durationMinutes, 10) : 60;
      const result = await conversationService.muteMember(
        req.params.id,
        req.user.userId,
        req.params.userId,
        duration,
      );
      res.status(200).json({ ok: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const conversationController = new ConversationController();
