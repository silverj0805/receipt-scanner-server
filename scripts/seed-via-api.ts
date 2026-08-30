// /debug/seed는 로컬 전용(NODE_ENV=production이면 라우터 자체가 없음)이라
// 배포 서버(Render)에는 못 씀. 대신 어느 환경에나 열려있는 공개 POST /receipts를
// 반복 호출해서 같은 더미 데이터를 채워 넣는 스크립트.
//
// 사용법:
//   npx tsx scripts/seed-via-api.ts <deviceId>                 # 기본값: 배포 URL
//   BASE_URL=http://localhost:3000 npx tsx scripts/seed-via-api.ts <deviceId>
import { buildDummyReceipts } from '../src/apps/debug/domain/dummy-receipts.util.js';

const BASE_URL = process.env.BASE_URL ?? 'https://receipt-scanner-server-8ff7.onrender.com';
const deviceIdArg = process.argv[2];

if (!deviceIdArg) {
  console.error('사용법: npx tsx scripts/seed-via-api.ts <deviceId>');
  process.exit(1);
}

const deviceId: string = deviceIdArg;

async function main() {
  const dummies = buildDummyReceipts(new Date());
  let ok = 0;

  for (const dummy of dummies) {
    const res = await fetch(`${BASE_URL}/receipts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': deviceId },
      body: JSON.stringify(dummy),
    });
    if (res.ok) {
      ok++;
    } else {
      console.error(`❌ ${dummy.merchant} 생성 실패 (${res.status}):`, await res.text());
    }
  }

  console.log(`${ok}/${dummies.length}개 생성 완료 (deviceId: ${deviceId}, target: ${BASE_URL})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
