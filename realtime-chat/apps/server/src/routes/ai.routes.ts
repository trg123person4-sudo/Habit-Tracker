import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { aiService } from '../services/ai.service.js';
import { AppError } from '../errors/app-error.js';

export const aiRouter = Router();

// 1. "Catch me up" summary
aiRouter.get('/catchup/:conversationId', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const summary = await aiService.catchUpSummary(req.params.conversationId, userId);
    res.json({ ok: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// 2. Smart contextual replies
aiRouter.get('/smart-replies/:conversationId', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const replies = await aiService.smartReplies(req.params.conversationId, userId);
    res.json({ ok: true, data: replies });
  } catch (err) {
    next(err);
  }
});

// 3. Real-time translation
aiRouter.post('/translate', requireAuth, async (req, res, next) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      throw AppError.badRequest('text and targetLanguage are required');
    }
    const result = await aiService.translateText(text, targetLanguage);
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

// 4. Pre-send tone check
aiRouter.post('/tone-check', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== 'string') {
      throw AppError.badRequest('text string is required');
    }
    const result = aiService.checkTone(text);
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});
