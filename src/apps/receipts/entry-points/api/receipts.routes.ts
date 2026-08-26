import { Router } from 'express';
import { classifyCategory } from '../../domain/category.util.js';
import { buildSummary, getMonthRanges } from '../../domain/summary.util.js';
import { parseTake, parseSkip } from '../../domain/pagination.util.js';
import {
  createReceipt,
  findAllReceipts,
  findReceiptsByDateRange,
  findReceiptById,
  updateReceipt,
  deleteReceipt,
} from '../../data-access/receipts.repository.js';

export const receiptsRouter = Router();

receiptsRouter.post('/', async (req, res) => {
  const { merchant, amount, rawText, date } = req.body;
  const category = classifyCategory(merchant);
  const receipt = await createReceipt({ merchant, amount, category, rawText, date: new Date(date) });
  res.status(201).json(receipt);
});

receiptsRouter.get('/', async (req, res) => {
  const take = parseTake(req.query.take);
  const skip = parseSkip(req.query.skip);
  const receipts = await findAllReceipts(take, skip);
  res.json(receipts);
});

// ⚠️ /summary는 /:id보다 반드시 먼저 등록 — 안 그러면 "summary"가 :id로 잘못 매칭됨
receiptsRouter.get('/summary', async (_req, res) => {
  const { startOfThisMonth, startOfNextMonth, startOfLastMonth } = getMonthRanges();
  const [thisMonth, lastMonth] = await Promise.all([
    findReceiptsByDateRange(startOfThisMonth, startOfNextMonth),
    findReceiptsByDateRange(startOfLastMonth, startOfThisMonth),
  ]);
  res.json(buildSummary(thisMonth, lastMonth));
});

receiptsRouter.get('/:id', async (req, res) => {
  const receipt = await findReceiptById(Number(req.params.id));
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  res.json(receipt);
});

receiptsRouter.patch('/:id', async (req, res) => {
  const { merchant, amount, rawText, date, category } = req.body;
  const data: Record<string, unknown> = {};
  if (merchant !== undefined) data.merchant = merchant;
  if (amount !== undefined) data.amount = amount;
  if (rawText !== undefined) data.rawText = rawText;
  if (date !== undefined) data.date = new Date(date);
  if (category !== undefined) data.category = category;
  const receipt = await updateReceipt(Number(req.params.id), data);
  res.json(receipt);
});

receiptsRouter.delete('/:id', async (req, res) => {
  await deleteReceipt(Number(req.params.id));
  res.status(204).send();
});
