type SummarySource = { amount: number; category: string };

export function buildSummary(
  thisMonth: SummarySource[],
  lastMonth: SummarySource[],
) {
  const total = thisMonth.reduce((sum, r) => sum + r.amount, 0);
  const lastTotal = lastMonth.reduce((sum, r) => sum + r.amount, 0);
  const deltaPercent =
    lastTotal === 0 ? 0 : Math.round(((total - lastTotal) / lastTotal) * 100);
  const deltaAmount = total - lastTotal;

  const byCategoryMap = new Map<string, number>();
  for (const r of thisMonth) {
    byCategoryMap.set(
      r.category,
      (byCategoryMap.get(r.category) ?? 0) + r.amount,
    );
  }
  const byCategory = Array.from(byCategoryMap.entries()).map(
    ([category, amount]) => ({
      category,
      amount,
      percent: total === 0 ? 0 : Math.round((amount / total) * 100),
    }),
  );

  return { total, deltaAmount, deltaPercent, byCategory };
}

export function getMonthRanges(now = new Date()) {
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { startOfThisMonth, startOfNextMonth, startOfLastMonth };
}
