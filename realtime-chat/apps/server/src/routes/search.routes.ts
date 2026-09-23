import { Router } from 'express';
import { searchController } from '../controllers/search.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const searchRouter = Router();

searchRouter.get('/', requireAuth, (req, res, next) =>
  searchController.searchGlobal(req, res, next),
);
