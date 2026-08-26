import { Router } from 'express';
import { CATEGORIES } from '../../domain/category.constants.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', (_req, res) => {
  res.json(CATEGORIES);
});
