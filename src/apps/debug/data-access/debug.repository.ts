import { prisma } from '../../../libraries/db.js';

export function resetAllReceipts() {
  return prisma.receipt.deleteMany();
}
