/**
 * In-memory fixed-window limiter for the unauthenticated connect endpoint,
 * which validates keys against Skydive and must not be usable as an
 * unrestricted key-checking oracle.
 *
 * Per-instance memory is the honest ceiling here: the BFF is serverless, so a
 * determined attacker gets one window per concurrent instance. That is still
 * a large multiple slower than unlimited, and a shared store (Redis or a
 * sessions table counter) is not warranted for this threat model.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Prune lazily on write; a dedicated sweeper is not worth a timer. */
function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimit = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimit {
  const now = Date.now();
  if (buckets.size > 10_000) prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** The client IP as the BFF sees it, or 'unknown' behind an unhelpful proxy. */
export function clientKey(c: { req: { header(name: string): string | undefined } }): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return c.req.header('x-real-ip') ?? 'unknown';
}
