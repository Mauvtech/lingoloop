/**
 * Limitation de débit en mémoire, par IP, sur fenêtre glissante.
 * « Au mieux » sur du serverless : chaque instance a sa propre mémoire.
 */
export interface RateLimiter {
  allow(key: string, now?: number): boolean;
}

export function createRateLimiter(limit = 30, windowMs = 60_000): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    allow(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return true;
    },
  };
}
