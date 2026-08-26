import { CATEGORY_RULES } from './category.constants';

export function classifyCategory(merchant: string): string {
  const rule = CATEGORY_RULES.find((r) => merchant.includes(r.keyword));
  return rule?.category ?? 'etc';
}
