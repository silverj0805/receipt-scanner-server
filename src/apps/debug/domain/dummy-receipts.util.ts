// /debug/seed 에서 사용하는 더미 영수증 20개 템플릿.
// merchant/itemName/category/amount는 최대한 다양하게(6개 카테고리 고르게 3~4건씩,
// 금액 1,400원~210,000원, itemName 있는 것/없는 것 혼합) 구성하고,
// 날짜는 daysAgo(호출 시점 기준 며칠 전)로 저장해 "이번 달/지난 달" 집계 테스트가
// 언제 seed를 실행해도 항상 유효하도록 함.
type DummyReceiptTemplate = {
  merchant: string;
  itemName?: string;
  amount: number;
  category: string;
  daysAgo: number;
};

const DUMMY_RECEIPT_TEMPLATES: DummyReceiptTemplate[] = [
  { merchant: '스타벅스 서울대입구점', itemName: '아메리카노+크로플', amount: 8900, category: 'food', daysAgo: 2 },
  { merchant: '배달의민족(도미노피자)', itemName: '페퍼로니 피자', amount: 27900, category: 'food', daysAgo: 5 },
  { merchant: '카카오T', amount: 13500, category: 'transit', daysAgo: 6 },
  { merchant: 'SRT', itemName: '부산행 왕복', amount: 118000, category: 'transit', daysAgo: 10 },
  { merchant: '다이소 강남점', itemName: '문구류', amount: 6800, category: 'shop', daysAgo: 12 },
  { merchant: '무신사', itemName: '후드집업', amount: 49000, category: 'shop', daysAgo: 15 },
  { merchant: '롯데시네마', itemName: '영화관람(2인)', amount: 32000, category: 'culture', daysAgo: 16 },
  { merchant: '예스24', itemName: '자기계발서 3권', amount: 42000, category: 'culture', daysAgo: 20 },
  { merchant: '삼성서울병원', itemName: '정기검진', amount: 210000, category: 'health', daysAgo: 23 },
  { merchant: '필라테스 강남점', amount: 180000, category: 'health', daysAgo: 25 },
  { merchant: 'GS25', amount: 4500, category: 'etc', daysAgo: 28 },
  { merchant: '한국전력공사', itemName: '전기요금', amount: 62000, category: 'etc', daysAgo: 29 },
  { merchant: '이디야커피', itemName: '카페라떼', amount: 4200, category: 'food', daysAgo: 33 },
  { merchant: '교촌치킨', itemName: '허니콤보', amount: 24000, category: 'food', daysAgo: 40 },
  { merchant: '서울교통공사', itemName: '지하철', amount: 1400, category: 'transit', daysAgo: 44 },
  { merchant: '올리브영', itemName: '스킨케어 세트', amount: 56000, category: 'shop', daysAgo: 50 },
  { merchant: '넷플릭스', itemName: '구독료', amount: 17000, category: 'culture', daysAgo: 58 },
  { merchant: '온누리약국', itemName: '종합감기약', amount: 15000, category: 'health', daysAgo: 60 },
  { merchant: 'GS칼텍스', itemName: '주유', amount: 70000, category: 'etc', daysAgo: 65 },
  { merchant: '코스트코', itemName: '생필품', amount: 132000, category: 'shop', daysAgo: 75 },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDummyReceipts(now: Date) {
  return DUMMY_RECEIPT_TEMPLATES.map(({ daysAgo, ...rest }) => ({
    ...rest,
    date: new Date(now.getTime() - daysAgo * DAY_MS),
  }));
}
