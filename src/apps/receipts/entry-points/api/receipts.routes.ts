import { Router } from 'express';
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

// 로그인 없이 "사람별 데이터 분리"만 구현 — 클라이언트가 최초 실행 시 생성해 저장해둔 UUID를
// 매 요청마다 헤더로 실어 보내는 방식. 진짜 인증은 아님(헤더 조작 가능) — 일반 사용 시나리오에서
// "내 영수증만 보인다"를 만족시키는 수준의 트레이드오프. 자세한 내용은 README 참고.
receiptsRouter.use((req, res, next) => {
  if (!req.header('X-Device-Id')) {
    return res.status(400).json({ error: 'X-Device-Id header is required' });
  }
  next();
});

receiptsRouter.post('/', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const { merchant, amount, category, rawText, date } = req.body;
  const receipt = await createReceipt({
    deviceId,
    merchant,
    amount,
    category,
    rawText,
    date: new Date(date),
  });
  res.status(201).json(receipt);
});

receiptsRouter.get('/', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const take = parseTake(req.query.take);
  const skip = parseSkip(req.query.skip);
  const receipts = await findAllReceipts(deviceId, take, skip);
  res.json(receipts);
});

// ⚠️ /summary는 /:id보다 반드시 먼저 등록 — 안 그러면 "summary"가 :id로 잘못 매칭됨
receiptsRouter.get('/summary', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const { startOfThisMonth, startOfNextMonth, startOfLastMonth } = getMonthRanges();
  const [thisMonth, lastMonth] = await Promise.all([
    findReceiptsByDateRange(deviceId, startOfThisMonth, startOfNextMonth),
    findReceiptsByDateRange(deviceId, startOfLastMonth, startOfThisMonth),
  ]);
  res.json(buildSummary(thisMonth, lastMonth));
});

receiptsRouter.get('/:id', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const receipt = await findReceiptById(deviceId, Number(req.params.id));
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  res.json(receipt);
});

receiptsRouter.patch('/:id', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const { merchant, amount, rawText, date, category } = req.body;
  const data: Record<string, unknown> = {};
  if (merchant !== undefined) data.merchant = merchant;
  if (amount !== undefined) data.amount = amount;
  if (rawText !== undefined) data.rawText = rawText;
  if (date !== undefined) data.date = new Date(date);
  if (category !== undefined) data.category = category;
  const receipt = await updateReceipt(deviceId, Number(req.params.id), data);
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  res.json(receipt);
});

receiptsRouter.delete('/:id', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const deleted = await deleteReceipt(deviceId, Number(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});
