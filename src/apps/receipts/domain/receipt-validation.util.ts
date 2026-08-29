import { CATEGORIES } from '@/apps/categories/domain/category.constants.js';

const VALID_CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

function isValidMerchant(v: unknown): boolean {
  return typeof v === 'string' && v.trim() !== '';
}

function isValidAmount(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function isValidCategory(v: unknown): boolean {
  return typeof v === 'string' && VALID_CATEGORY_IDS.has(v);
}

function isValidDate(v: unknown): boolean {
  return typeof v === 'string' && !Number.isNaN(new Date(v).getTime());
}

function isValidOptionalString(v: unknown): boolean {
  return v === undefined || typeof v === 'string';
}

const CATEGORY_ERROR = `category는 다음 중 하나여야 합니다: ${[...VALID_CATEGORY_IDS].join(', ')}`;

export function validateReceiptCreate(body: unknown): string[] {
  const errors: string[] = [];
  if (typeof body !== 'object' || body === null) return ['요청 바디가 올바르지 않습니다.'];
  const b = body as Record<string, unknown>;

  if (!isValidMerchant(b.merchant)) errors.push('merchant는 비어있지 않은 문자열이어야 합니다.');
  if (!isValidAmount(b.amount)) errors.push('amount는 0보다 큰 숫자여야 합니다.');
  if (!isValidCategory(b.category)) errors.push(CATEGORY_ERROR);
  if (!isValidDate(b.date)) errors.push('date는 올바른 날짜 문자열이어야 합니다.');
  if (!isValidOptionalString(b.rawText)) errors.push('rawText는 문자열이어야 합니다.');
  if (!isValidOptionalString(b.itemName)) errors.push('itemName은 문자열이어야 합니다.');

  return errors;
}

export function validateReceiptPatch(body: unknown): string[] {
  const errors: string[] = [];
  if (typeof body !== 'object' || body === null) return ['요청 바디가 올바르지 않습니다.'];
  const b = body as Record<string, unknown>;

  if (b.merchant !== undefined && !isValidMerchant(b.merchant)) {
    errors.push('merchant는 비어있지 않은 문자열이어야 합니다.');
  }
  if (b.amount !== undefined && !isValidAmount(b.amount)) {
    errors.push('amount는 0보다 큰 숫자여야 합니다.');
  }
  if (b.category !== undefined && !isValidCategory(b.category)) {
    errors.push(CATEGORY_ERROR);
  }
  if (b.date !== undefined && !isValidDate(b.date)) {
    errors.push('date는 올바른 날짜 문자열이어야 합니다.');
  }
  if (!isValidOptionalString(b.rawText)) {
    errors.push('rawText는 문자열이어야 합니다.');
  }
  if (!isValidOptionalString(b.itemName)) {
    errors.push('itemName은 문자열이어야 합니다.');
  }

  return errors;
}
