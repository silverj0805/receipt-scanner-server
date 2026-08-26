import { prisma } from '../../../libraries/db.js';

export function createReceipt(data: {
  merchant: string;
  amount: number;
  category: string;
  rawText?: string;
  date: Date;
}) {
  return prisma.receipt.create({ data });
}

export function findAllReceipts() {
  return prisma.receipt.findMany({ orderBy: { date: 'desc' } });
}

export function findReceiptsByDateRange(start: Date, end: Date) {
  return prisma.receipt.findMany({ where: { date: { gte: start, lt: end } } });
}

export function findReceiptById(id: number) {
  return prisma.receipt.findUnique({ where: { id } });
}

export function updateReceipt(
  id: number,
  data: Partial<{
    merchant: string;
    amount: number;
    category: string;
    rawText: string;
    date: Date;
  }>,
) {
  return prisma.receipt.update({ where: { id }, data });
}
