import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// 데모/로컬 테스트용 더미 데이터 — 전부 같은 deviceId로 묶어서
// GET /receipts?take=... 나 /receipts/summary에서 바로 확인할 수 있게 함.
const DEVICE_ID = 'demo-device-001';

const DUMMY_RECEIPTS: {
  merchant: string;
  itemName?: string;
  amount: number;
  category: string;
  rawText?: string;
  date: string;
}[] = [
  // 이번 달 (2026-08)
  { merchant: '스타벅스 강남점', itemName: '아메리카노', amount: 4500, category: 'food', date: '2026-08-03' },
  { merchant: '이디야커피', itemName: '카페라떼', amount: 4000, category: 'food', date: '2026-08-04' },
  { merchant: '교촌치킨', itemName: '교촌 오리지날', amount: 23000, category: 'food', date: '2026-08-05' },
  { merchant: 'GS25', amount: 8500, category: 'etc', date: '2026-08-06' },
  { merchant: '카카오T', amount: 9200, category: 'transit', date: '2026-08-07' },
  { merchant: '서울교통공사', itemName: '지하철', amount: 1400, category: 'transit', date: '2026-08-08' },
  { merchant: '올리브영', itemName: '선크림', amount: 34200, category: 'shop', date: '2026-08-10' },
  { merchant: '무신사', itemName: '반팔티', amount: 29000, category: 'shop', date: '2026-08-12' },
  { merchant: 'CGV', itemName: '영화관람', amount: 15000, category: 'culture', date: '2026-08-14' },
  { merchant: '교보문고', itemName: '소설책', amount: 18000, category: 'culture', date: '2026-08-16' },
  { merchant: '스포애니', amount: 89000, category: 'health', date: '2026-08-18' },
  { merchant: '온누리약국', itemName: '감기약', amount: 12000, category: 'health', date: '2026-08-20' },
  // 지난 달 (2026-07)
  { merchant: '스타벅스 역삼점', itemName: '카페모카', amount: 5500, category: 'food', date: '2026-07-05' },
  { merchant: '카카오T블루', amount: 12800, category: 'transit', date: '2026-07-08' },
  { merchant: '다이소', itemName: '생활용품', amount: 11000, category: 'shop', date: '2026-07-10' },
  { merchant: '넷플릭스', itemName: '구독료', amount: 17000, category: 'culture', date: '2026-07-12' },
  { merchant: '필라테스 강남점', amount: 150000, category: 'health', date: '2026-07-15' },
  { merchant: 'GS칼텍스', itemName: '주유', amount: 60000, category: 'etc', date: '2026-07-18' },
  { merchant: '맘스터치', itemName: '싸이버거세트', amount: 7900, category: 'food', date: '2026-07-22' },
  { merchant: '유니클로', itemName: '히트텍', amount: 14900, category: 'shop', date: '2026-07-25' },
];

async function main() {
  for (const r of DUMMY_RECEIPTS) {
    await prisma.receipt.create({
      data: { deviceId: DEVICE_ID, ...r, date: new Date(r.date) },
    });
  }
  console.log(`${DUMMY_RECEIPTS.length}개 더미 영수증 생성 완료 (deviceId: ${DEVICE_ID})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
