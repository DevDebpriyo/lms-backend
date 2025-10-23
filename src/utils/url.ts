/**
 * Derive a single frontend base URL to use as return_url.
 * Supports comma-separated FRONTEND_URLS or FRONTEND_URL values and tolerates trailing slashes.
 */
export function getFrontendBaseUrl(): string | undefined {
  const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (!raw) return undefined;
  const first = raw.split(',')[0]?.trim();
  if (!first) return undefined;
  // remove a single trailing slash if present
  return first.replace(/\/$/, '');
}

/** Normalize comma-separated origins, trimming whitespace and trailing slashes. */
export function parseAllowedOrigins(): string[] {
  const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/$/, ''));
}

/** Join a base URL with a path, handling trailing/leading slashes gracefully. */
export function buildReturnUrl(path: string): string | undefined {
  const base = getFrontendBaseUrl();
  if (!base) return undefined;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
