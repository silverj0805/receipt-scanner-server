import { CATEGORIES } from '../../categories/domain/category.constants.js';

const VALID_CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

export type MonthRange = { start: Date; end: Date };

export type ReceiptFilters = {
  categories?: string[];
  monthRange?: MonthRange;
};

// category 쿼리 파라미터: 콤마로 구분한 카테고리 id 목록.
// 생략(또는 빈 문자열)이면 "전체" — 필터 없음.
// 6개(=전체 카테고리) 전부 넘겨도 필터링 결과는 전체와 동일(모든 영수증의 category가
// 이 6개 중 하나이므로 `category IN (전체 6개)`와 필터 없음이 같은 결과를 냄) — 별도 분기 불필요.
function parseCategories(value: unknown): { categories?: string[]; error?: string } {
  if (value === undefined || value === '') return {};

  const raw = Array.isArray(value) ? value : String(value).split(',');
  const trimmed = raw.map((v) => String(v).trim()).filter((v) => v !== '');
  if (trimmed.length === 0) return {};

  const invalid = trimmed.filter((c) => !VALID_CATEGORY_IDS.has(c));
  if (invalid.length > 0) {
    return {
      error: `category에 유효하지 않은 값이 있습니다: ${invalid.join(', ')} (가능한 값: ${[...VALID_CATEGORY_IDS].join(', ')})`,
    };
  }

  return { categories: [...new Set(trimmed)] };
}

// month 쿼리 파라미터: "YYYY-MM" 형식. 생략하면 "전체" — 기간 필터 없음.
function parseMonth(value: unknown): { monthRange?: MonthRange; error?: string } {
  if (value === undefined || value === '') return {};

  const match = /^(\d{4})-(\d{2})$/.exec(String(value));
  if (!match) return { error: 'month는 YYYY-MM 형식이어야 합니다.' };

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return { error: 'month는 01~12 사이여야 합니다.' };

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { monthRange: { start, end } };
}

export function parseReceiptFilters(query: { category?: unknown; month?: unknown }): {
  filters: ReceiptFilters;
  errors: string[];
} {
  const errors: string[] = [];
  const categoryResult = parseCategories(query.category);
  const monthResult = parseMonth(query.month);

  if (categoryResult.error) errors.push(categoryResult.error);
  if (monthResult.error) errors.push(monthResult.error);

  return {
    filters: {
      ...(categoryResult.categories ? { categories: categoryResult.categories } : {}),
      ...(monthResult.monthRange ? { monthRange: monthResult.monthRange } : {}),
    },
    errors,
  };
}
