import swaggerJsdoc from 'swagger-jsdoc';

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
  apis: [
    './src/apps/**/entry-points/api/*.routes.ts',
    './src/apps/**/entry-points/api/*.routes.js',
  ],
});
