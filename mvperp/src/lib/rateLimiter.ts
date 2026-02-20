// lib/rateLimiter.ts
/**
 * In-memory rate limiter to prevent accidental mass stamping
 * Tracks request counts per user/company within time windows
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if request is allowed
   * @param key - Unique identifier (e.g., userId, companyId)
   * @param maxRequests - Maximum requests allowed in the time window
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous requests or window expired - allow and start new window
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Within window, check if under limit
    if (entry.count < maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, maxRequests: number): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset (in seconds)
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return Math.ceil((entry.resetTime - Date.now()) / 1000);
  }

  /**
   * Clean up expired entries (prevents memory leaks)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key (useful for testing)
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Get current count for a key
   */
  getCount(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}

// Rate limit configurations
export const STAMP_RATE_LIMITS = {
  // Production mode (stricter to prevent costly mistakes)
  production: {
    perMinute: 5, // Max 5 stamps per minute
    perHour: 30, // Max 30 stamps per hour
  },

  // Sandbox mode (more lenient for testing)
  sandbox: {
    perMinute: 20, // Max 20 stamps per minute
    perHour: 200, // Max 200 stamps per hour
  },
};
