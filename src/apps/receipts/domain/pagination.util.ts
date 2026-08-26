const DEFAULT_TAKE = 10;
const MAX_TAKE = 50;

export function parseTake(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return DEFAULT_TAKE;
  return Math.min(n, MAX_TAKE);
}

export function parseSkip(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}
