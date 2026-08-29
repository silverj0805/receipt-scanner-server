import { prisma } from '../../../libraries/db.js';

export function createReceipt(data: {
  deviceId: string;
  merchant: string;
  itemName?: string;
  amount: number;
  category: string;
  rawText?: string;
  date: Date;
}) {
  return prisma.receipt.create({ data });
}

export function findAllReceipts(deviceId: string, take: number, skip: number) {
  return prisma.receipt.findMany({
    where: { deviceId },
    orderBy: { date: 'desc' },
    take,
    skip,
    select: { id: true, merchant: true, itemName: true, amount: true, date: true, category: true },
  });
}

export function findReceiptsByDateRange(deviceId: string, start: Date, end: Date) {
  return prisma.receipt.findMany({ where: { deviceId, date: { gte: start, lt: end } } });
}

export function findReceiptById(deviceId: string, id: number) {
  return prisma.receipt.findFirst({ where: { id, deviceId } });
}

export async function updateReceipt(
  deviceId: string,
  id: number,
  data: Partial<{
    merchant: string;
    itemName: string;
    amount: number;
    category: string;
    rawText: string;
    date: Date;
  }>,
) {
  const existing = await prisma.receipt.findFirst({ where: { id, deviceId } });
  if (!existing) return null;
  return prisma.receipt.update({ where: { id }, data });
}

export async function deleteReceipt(deviceId: string, id: number) {
  const existing = await prisma.receipt.findFirst({ where: { id, deviceId } });
  if (!existing) return false;
  await prisma.receipt.delete({ where: { id } });
  return true;
}
