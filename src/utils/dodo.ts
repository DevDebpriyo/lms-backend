export type PlanType = 'monthly' | 'yearly';

/** Map a Dodo product_id to a plan type using env overrides first. */
export function mapProductToPlan(productId?: string | null): PlanType | undefined {
  if (!productId) return undefined;
  const monthly = process.env.DODO_PRODUCT_MONTHLY_ID || process.env.DODO_MONTHLY_PRODUCT_ID;
  const yearly = process.env.DODO_PRODUCT_YEARLY_ID || process.env.DODO_YEARLY_PRODUCT_ID;
  if (monthly && String(monthly) === String(productId)) return 'monthly';
  if (yearly && String(yearly) === String(productId)) return 'yearly';
  return undefined;
}

/** Infer plan type from text such as 'Month'/'Year' fields if product mapping isn't set. */
export function inferPlanFromInterval(interval?: string | null): PlanType | undefined {
  const v = String(interval || '').toLowerCase();
  if (v.includes('month')) return 'monthly';
  if (v.includes('year') || v.includes('annual')) return 'yearly';
  return undefined;
}
