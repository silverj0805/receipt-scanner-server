import { Router } from 'express';
import { CATEGORIES } from '@/apps/categories/domain/category.constants.js';

export const categoriesRouter = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: 카테고리 목록 조회 (정적 메타데이터, DB 미사용)
 *     tags: [categories]
 *     responses:
 *       200:
 *         description: 카테고리 6개
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
categoriesRouter.get('/', (_req, res) => {
  res.json(CATEGORIES);
});
