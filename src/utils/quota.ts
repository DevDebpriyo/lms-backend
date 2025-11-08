export type QuotaSubject = 'user' | 'apiKey';

export const FREE_PLAN_LIMIT = 50_000; // characters per calendar month

export function currentMonthWindow(reference = new Date()) {
  const start = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export function countCharsFromBody(body: any): number {
  // Sum lengths of all string fields in the payload (shallow + nested)
  const seen = new Set<any>();
  function walk(val: any): number {
    if (val == null) return 0;
    if (typeof val === 'string') return [...val].length; // Unicode code points
    if (typeof val !== 'object') return 0;
    if (seen.has(val)) return 0;
    seen.add(val);
    if (Array.isArray(val)) return val.reduce((sum, v) => sum + walk(v), 0);
  return Object.values(val).reduce((sum: number, v: any) => sum + walk(v), 0);
  }
  return walk(body);
}

export function remainingAfter(limit: number, used: number, nextCount: number) {
  const rem = limit - used - nextCount;
  return rem > 0 ? rem : 0;
}
