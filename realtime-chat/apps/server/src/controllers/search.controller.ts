import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service.js';
import { AppError } from '../errors/app-error.js';

export class SearchController {
  async searchGlobal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const q = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;

      const results = await searchService.searchGlobal(userId, q || '', limit);
      res.json({ results });
    } catch (err) {
      next(err);
    }
  }

  async searchConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        throw AppError.unauthorized('Authentication required');
      }

      const { id } = req.params;
      const q = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;

      const results = await searchService.searchConversation(userId, id, q || '', limit);
      res.json({ results });
    } catch (err) {
      next(err);
    }
  }
}

export const searchController = new SearchController();
