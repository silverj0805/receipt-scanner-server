import { Router } from 'express';
import { resetAllReceipts } from '../../data-access/debug.repository.js';
import { createReceipt } from '../../../receipts/data-access/receipts.repository.js';
import { buildDummyReceipts } from '../../domain/dummy-receipts.util.js';

export const debugRouter = Router();

/**
 * @openapi
 * /debug/reset:
 *   post:
 *     summary: (Debug 전용) 전체 영수증 데이터 초기화
 *     description: >
 *       로컬/개발 환경(NODE_ENV !== production)에서만 라우터 자체가 마운트됨 — 프로덕션에는 존재하지 않음.
 *       X-Device-Id와 무관하게 모든 영수증을 삭제.
 *     tags: [debug]
 *     responses:
 *       200:
 *         description: 삭제된 건수
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted: { type: integer }
 */
debugRouter.post('/reset', async (_req, res) => {
  const { count } = await resetAllReceipts();
  res.json({ deleted: count });
});

/**
 * @openapi
 * /debug/seed:
 *   post:
 *     summary: (Debug 전용) 특정 deviceId로 더미 영수증 20개 생성
 *     description: >
 *       로컬/개발 환경(NODE_ENV !== production)에서만 라우터 자체가 마운트됨 — 프로덕션에는 존재하지 않음.
 *       카테고리 6종/금액/날짜가 다양하게 분포된 더미 데이터 20건을 요청받은 deviceId로 생성.
 *     tags: [debug]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deviceId]
 *             properties:
 *               deviceId: { type: string }
 *     responses:
 *       201:
 *         description: 생성 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 created: { type: integer }
 *                 deviceId: { type: string }
 *       400:
 *         description: deviceId 누락
 */
debugRouter.post('/seed', async (req, res) => {
  const { deviceId } = req.body ?? {};
  if (typeof deviceId !== 'string' || deviceId.trim() === '') {
    return res.status(400).json({ error: 'deviceId is required' });
  }

  const dummies = buildDummyReceipts(new Date());
  for (const dummy of dummies) {
    await createReceipt({ deviceId, ...dummy });
  }

  res.status(201).json({ created: dummies.length, deviceId });
});
