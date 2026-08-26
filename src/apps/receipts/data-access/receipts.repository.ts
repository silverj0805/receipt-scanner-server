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
