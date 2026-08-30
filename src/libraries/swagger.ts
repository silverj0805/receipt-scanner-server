import swaggerJsdoc from 'swagger-jsdoc';
import { shouldMountDebugRoutes } from '../apps/debug/domain/debug-env.util.js';

// app.ts가 라우터를 실제로 마운트할지 판단하는 것과 같은 함수를 그대로 씀 —
// 그렇지 않으면 프로덕션에서 /debug가 실제론 404인데 Swagger 문서에는
// 존재하는 것처럼 나오는 불일치가 생김(문서와 실제 동작이 항상 일치해야 함).
const routeApis = [
  './src/apps/receipts/entry-points/api/*.routes.ts',
  './src/apps/receipts/entry-points/api/*.routes.js',
  './src/apps/categories/entry-points/api/*.routes.ts',
  './src/apps/categories/entry-points/api/*.routes.js',
];

if (shouldMountDebugRoutes(process.env.NODE_ENV)) {
  routeApis.push(
    './src/apps/debug/entry-points/api/*.routes.ts',
    './src/apps/debug/entry-points/api/*.routes.js',
  );
}

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'receipt-scanner-server API',
      version: '1.0.0',
      description:
        '영수증 스캔 가계부 백엔드 API. `/receipts` 하위 엔드포인트는 모두 `X-Device-Id` 헤더가 필요함(로그인 없이 기기 단위로 데이터를 분리 — 자세한 내용은 README 참고).',
    },
    components: {
      parameters: {
        DeviceId: {
          name: 'X-Device-Id',
          in: 'header',
          required: true,
          schema: { type: 'string' },
          description: '클라이언트가 최초 실행 시 생성해 저장하는 UUID. 이 값으로 데이터를 스코프함(진짜 인증 아님).',
        },
      },
      schemas: {
        Receipt: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            deviceId: { type: 'string' },
            merchant: { type: 'string' },
            itemName: { type: 'string', nullable: true, description: '무엇을 샀는지(상품명), 선택 입력' },
            amount: { type: 'integer' },
            category: { type: 'string', enum: ['food', 'transit', 'shop', 'culture', 'health', 'etc'] },
            rawText: { type: 'string', nullable: true },
            date: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ReceiptListItem: {
          type: 'object',
          description: '목록 조회에서는 상세 필드(deviceId/rawText/createdAt)를 빼고 리스트 렌더링에 필요한 필드만 내려줌',
          properties: {
            id: { type: 'integer' },
            merchant: { type: 'string' },
            itemName: { type: 'string', nullable: true },
            amount: { type: 'integer' },
            date: { type: 'string', format: 'date-time' },
            category: { type: 'string', enum: ['food', 'transit', 'shop', 'culture', 'health', 'etc'] },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
          },
        },
      },
    },
  },
  apis: routeApis,
});
