// In-memory rate limiter with optional Upstash fallback.
// Per-IP sliding window: max N requests per M milliseconds.

interface Bucket {
  timestamps: number[];
}
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export const rateLimit = (
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult => {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0, resetMs: oldest + windowMs - now };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length, resetMs: windowMs };
};

export const getClientIp = (req: Request): string => {
  const headers = req.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
};
