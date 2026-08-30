import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// 런타임 쿼리는 transaction pooler(DATABASE_URL, pgbouncer)를 씀 — CLI 마이그레이션용
// DIRECT_URL(session pooler)과는 용도가 다름(prisma7.config.ts 참고).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
