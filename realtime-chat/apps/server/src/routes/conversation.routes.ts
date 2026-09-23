import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller.js';
import { searchController } from '../controllers/search.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const conversationRouter = Router();

// Public channels can be listed or joined
conversationRouter.get('/public', requireAuth, (req, res, next) =>
  conversationController.getPublicChannels(req, res, next),
);

conversationRouter.get('/', requireAuth, (req, res, next) =>
  conversationController.list(req, res, next),
);

conversationRouter.post('/', requireAuth, (req, res, next) =>
  conversationController.create(req, res, next),
);

conversationRouter.get('/:id', requireAuth, (req, res, next) =>
  conversationController.getById(req, res, next),
);

conversationRouter.patch('/:id', requireAuth, (req, res, next) =>
  conversationController.update(req, res, next),
);

conversationRouter.post('/:id/join', requireAuth, (req, res, next) =>
  conversationController.join(req, res, next),
);

conversationRouter.post('/:id/leave', requireAuth, (req, res, next) =>
  conversationController.leave(req, res, next),
);

conversationRouter.get('/:id/messages', requireAuth, (req, res, next) =>
  conversationController.getMessages(req, res, next),
);

// Channel-scoped full-text search
conversationRouter.get('/:id/search', requireAuth, (req, res, next) =>
  searchController.searchConversation(req, res, next),
);

// Moderation: Kick member
conversationRouter.delete('/:id/members/:userId', requireAuth, (req, res, next) =>
  conversationController.kickMember(req, res, next),
);

// Thread & Pin & Saved endpoints
conversationRouter.get('/:id/threads/:msgId', requireAuth, async (req, res, next) => {
  try {
    const thread = await import('../services/message.service.js').then((m) =>
      m.messageService.getThread(req.params.msgId, (req as any).user.userId),
    );
    res.json({ ok: true, data: thread });
  } catch (err) {
    next(err);
  }
});

conversationRouter.get('/:id/pinned', requireAuth, async (req, res, next) => {
  try {
    const pinned = await import('../services/message.service.js').then((m) =>
      m.messageService.getPinnedMessages(req.params.id, (req as any).user.userId),
    );
    res.json({ ok: true, data: pinned });
  } catch (err) {
    next(err);
  }
});

conversationRouter.get('/user/saved', requireAuth, async (req, res, next) => {
  try {
    const saved = await import('../services/message.service.js').then((m) =>
      m.messageService.getSavedMessages((req as any).user.userId),
    );
    res.json({ ok: true, data: saved });
  } catch (err) {
    next(err);
  }
});


