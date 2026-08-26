import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { receiptsRouter } from './apps/receipts/entry-points/api/receipts.routes.js';
import { categoriesRouter } from './apps/categories/entry-points/api/categories.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/receipts', receiptsRouter);
app.use('/categories', categoriesRouter);

// 예상 못한 에러(500)는 항상 이 핸들러를 거침 — NODE_ENV 설정 여부와 무관하게
// 스택트레이스/에러 상세를 응답에 절대 노출하지 않고 서버 로그에만 남김.
// (express-async-errors 없이도 Express 5는 async 핸들러의 reject를 자동으로 여기로 넘겨줌)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
