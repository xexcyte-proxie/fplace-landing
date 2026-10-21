/**
 * Tiny in-memory rate limiter for the public form endpoints.
 *
 * The store lives in the Node.js process, so it resets when the server
 * restarts and is per-instance. That is enough to blunt casual form spam.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;
const MAX_TRACKED_KEYS = 5000;

const hits = new Map<string, number[]>();

/** Best-effort client IP from the usual proxy headers. */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Records a request for the given key and reports whether the caller is over
 * the limit. Requests over the limit are not recorded.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (hits.get(key) ?? []).filter((time) => time > windowStart);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  if (hits.size > MAX_TRACKED_KEYS) {
    for (const [storedKey, times] of hits) {
      if (times.every((time) => time <= windowStart)) {
        hits.delete(storedKey);
      }
    }
  }

  return false;
}
