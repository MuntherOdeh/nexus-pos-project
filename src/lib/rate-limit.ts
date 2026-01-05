import { NextRequest } from "next/server";

interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimiter {
  check: (identifier: string, limit: number) => Promise<{ success: boolean; remaining: number }>;
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Create a rate limiter instance
 * This matches the expected API: rateLimit({ interval, uniqueTokenPerInterval })
 */
export function rateLimit(config: RateLimitConfig): RateLimiter {
  return {
    check: async (identifier: string, limit: number): Promise<{ success: boolean; remaining: number }> => {
      const now = Date.now();
      const key = identifier;
      const entry = rateLimitStore.get(key);

      if (!entry || now > entry.resetTime) {
        // Create new entry
        const newEntry: RateLimitEntry = {
          count: 1,
          resetTime: now + config.interval,
        };
        rateLimitStore.set(key, newEntry);
        return {
          success: true,
          remaining: limit - 1,
        };
      }

      if (entry.count >= limit) {
        return {
          success: false,
          remaining: 0,
        };
      }

      // Increment count
      entry.count++;
      rateLimitStore.set(key, entry);

      return {
        success: true,
        remaining: limit - entry.count,
      };
    },
  };
}

/**
 * Get client IP from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "127.0.0.1";
}

/**
 * Rate limit middleware response
 */
export function rateLimitResponse(retryAfter: number = 60): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Please try again later",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
