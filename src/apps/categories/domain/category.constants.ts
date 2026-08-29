export type CategoryId = 'food' | 'transit' | 'shop' | 'culture' | 'health' | 'etc';

// 색상(bg/color)은 프론트에서 처리 — 백엔드는 id/label만 내려줌.
// health는 목업(Confirm.dc.html)에는 없는 카테고리(2026-08-27 백엔드 확장분).
export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'food', label: '식비' },
  { id: 'transit', label: '교통' },
  { id: 'shop', label: '쇼핑' },
  { id: 'culture', label: '문화' },
  { id: 'health', label: '건강' },
  { id: 'etc', label: '기타' },
];
