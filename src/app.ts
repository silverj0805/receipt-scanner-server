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
