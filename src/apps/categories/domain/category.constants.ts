export type CategoryId = 'food' | 'transit' | 'shop' | 'culture' | 'health' | 'etc';

// bg/color 값은 앱 목업(Confirm.dc.html)의 카테고리 칩 팔레트를 그대로 따름.
// health는 목업에는 없는 카테고리(2026-08-27 백엔드 확장분) — 나머지 5개와
// 톤을 맞춘 민트 계열 팔레트를 새로 지정함.
export const CATEGORIES: { id: CategoryId; label: string; bg: string; color: string }[] = [
  { id: 'food', label: '식비', bg: '#FBE6DB', color: '#A45A2A' },
  { id: 'transit', label: '교통', bg: '#E1EEFB', color: '#2B6CA3' },
  { id: 'shop', label: '쇼핑', bg: '#EDE3FA', color: '#6B47A8' },
  { id: 'culture', label: '문화', bg: '#FBF1D2', color: '#9C7A12' },
  { id: 'health', label: '건강', bg: '#DCF3EE', color: '#12786B' },
  { id: 'etc', label: '기타', bg: '#ECEAE6', color: '#6F6D68' },
];
