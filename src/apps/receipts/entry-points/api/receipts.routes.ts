import { Router } from 'express';
import { buildSummary, getMonthRanges } from '../../domain/summary.util.js';
import { parseTake, parseSkip } from '../../domain/pagination.util.js';
import { validateReceiptCreate, validateReceiptPatch } from '../../domain/receipt-validation.util.js';
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

/**
 * @openapi
 * /receipts:
 *   post:
 *     summary: 영수증 생성
 *     tags: [receipts]
 *     parameters:
 *       - $ref: '#/components/parameters/DeviceId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [merchant, amount, category, date]
 *             properties:
 *               merchant: { type: string }
 *               amount: { type: integer }
 *               category: { type: string, enum: [food, transit, shop, culture, health, etc] }
 *               rawText: { type: string }
 *               date: { type: string, format: date }
 *     responses:
 *       201:
 *         description: 생성됨
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: X-Device-Id 헤더 누락 또는 입력값 검증 실패
 */
receiptsRouter.post('/', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const errors = validateReceiptCreate(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });
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

/**
 * @openapi
 * /receipts:
 *   get:
 *     summary: 영수증 목록 조회 (페이지네이션)
 *     tags: [receipts]
 *     parameters:
 *       - $ref: '#/components/parameters/DeviceId'
 *       - name: take
 *         in: query
 *         schema: { type: integer, default: 10, maximum: 50 }
 *       - name: skip
 *         in: query
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: 영수증 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 */
receiptsRouter.get('/', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const take = parseTake(req.query.take);
  const skip = parseSkip(req.query.skip);
  const receipts = await findAllReceipts(deviceId, take, skip);
  res.json(receipts);
});

/**
 * @openapi
 * /receipts/summary:
 *   get:
 *     summary: 대시보드 집계 (이번 달 합계, 카테고리 비율, 전월 대비)
 *     tags: [receipts]
 *     parameters:
 *       - $ref: '#/components/parameters/DeviceId'
 *     responses:
 *       200:
 *         description: 집계 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total: { type: integer }
 *                 deltaPercent: { type: integer }
 *                 byCategory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category: { type: string }
 *                       amount: { type: integer }
 *                       percent: { type: integer }
 */
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

/**
 * @openapi
 * /receipts/{id}:
 *   get:
 *     summary: 영수증 단건 조회
 *     tags: [receipts]
 *     parameters:
 *       - $ref: '#/components/parameters/DeviceId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: 영수증
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: 없거나 다른 device 소유
 */
receiptsRouter.get('/:id', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const receipt = await findReceiptById(deviceId, Number(req.params.id));
  if (!receipt) return res.status(404).json({ error: 'Not found' });
  res.json(receipt);
});

/**
 * @openapi
 * /receipts/{id}:
 *   patch:
 *     summary: 영수증 수정 (부분 업데이트)
 *     tags: [receipts]
 *     parameters:
 *       - $ref: '#/components/parameters/DeviceId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchant: { type: string }
 *               amount: { type: integer }
 *               category: { type: string, enum: [food, transit, shop, culture, health, etc] }
 *               rawText: { type: string }
 *               date: { type: string, format: date }
 *     responses:
 *       200:
 *         description: 수정된 영수증
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: 입력값 검증 실패
 *       404:
 *         description: 없거나 다른 device 소유
 */
receiptsRouter.patch('/:id', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const errors = validateReceiptPatch(req.body);
  if (errors.length > 0) return res.status(400).json({ errors });
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

/**
 * @openapi
 * /receipts/{id}:
 *   delete:
 *     summary: 영수증 삭제
 *     tags: [receipts]
 *     parameters:
 *       - $ref: '#/components/parameters/DeviceId'
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: 삭제됨
 *       404:
 *         description: 없거나 다른 device 소유
 */
receiptsRouter.delete('/:id', async (req, res) => {
  const deviceId = req.header('X-Device-Id')!;
  const deleted = await deleteReceipt(deviceId, Number(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});
