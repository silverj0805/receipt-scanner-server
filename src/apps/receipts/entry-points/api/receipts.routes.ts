import { Router } from 'express';
import { classifyCategory } from '../../domain/category.util.js';
import { createReceipt } from '../../data-access/receipts.repository.js';

export const receiptsRouter = Router();

receiptsRouter.post('/', async (req, res) => {
  const { merchant, amount, rawText, date } = req.body;
  const category = classifyCategory(merchant);
  const receipt = await createReceipt({ merchant, amount, category, rawText, date: new Date(date) });
  res.status(201).json(receipt);
});

// Task 3부터 이 라우터에 라우트가 이어서 추가됨 (GET /, GET /summary, GET /:id, PATCH /:id, DELETE /:id)
