// Client-side cache utility for API responses and request deduplication

type CacheEntry = {
  data: unknown;
  timestamp: number;
  ttl: number;
};

type PendingRequest = {
  promise: Promise<unknown>;
  timestamp: number;
};

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, PendingRequest>();
  private stats = {
    hits: 0,
    misses: 0,
    requests: 0,
    deduplicated: 0,
  };

  // Cache TTL in milliseconds
  private static readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes
  private static readonly PENDING_REQUEST_TTL = 30 * 1000; // 30 seconds

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanupExpiredEntries(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    // Clean up expired pending requests
    const now = Date.now();
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > ApiCache.PENDING_REQUEST_TTL) {
        this.pendingRequests.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    this.stats.requests++;
    
    const entry = this.cache.get(key);
    if (!entry || this.isExpired(entry)) {
      this.stats.misses++;
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  set(key: string, data: unknown, ttl = ApiCache.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      requests: 0,
      deduplicated: 0,
    };
  }

  getStats() {
    this.cleanupExpiredEntries();
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      hitRatio: this.stats.requests > 0 ? (this.stats.hits / this.stats.requests * 100).toFixed(2) + '%' : '0%',
    };
  }

  // Request deduplication - prevents multiple identical requests
  async deduplicate<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    ttl = ApiCache.DEFAULT_TTL
  ): Promise<T> {
    // First check if we have a cached result
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      this.stats.deduplicated++;
      return pending.promise as Promise<T>;
    }

    // Create new request
    const promise = fetchFn().then((result) => {
      // Cache the result
      this.set(key, result, ttl);
      // Remove from pending requests
      this.pendingRequests.delete(key);
      return result;
    }).catch((error) => {
      // Remove from pending requests on error
      this.pendingRequests.delete(key);
      throw error;
    });

    // Store the pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  // Helper method for fetch with caching and deduplication
  async fetchWithCache<T>(
    url: string,
    options?: RequestInit,
    ttl = ApiCache.DEFAULT_TTL
  ): Promise<T> {
    const key = this.generateKey(url, options);
    
    return this.deduplicate<T>(
      key,
      async () => {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      },
      ttl
    );
  }
}

// Global cache instance
export const apiCache = new ApiCache();

// Helper for exponential backoff
export class ExponentialBackoff {
  private attempts = new Map<string, number>();
  private lastAttempt = new Map<string, number>();
  
  private static readonly BASE_DELAY = 1000; // 1 second
  private static readonly MAX_DELAY = 30000; // 30 seconds
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly RESET_TIME = 5 * 60 * 1000; // 5 minutes

  shouldRetry(key: string, error?: Error): boolean {
    // Don't retry on 4xx errors (except 429)
    if (error?.message.includes('HTTP 4') && !error.message.includes('429')) {
      return false;
    }

    const attempts = this.attempts.get(key) || 0;
    const lastAttempt = this.lastAttempt.get(key) || 0;
    const now = Date.now();

    // Reset attempts if enough time has passed
    if (now - lastAttempt > ExponentialBackoff.RESET_TIME) {
      this.attempts.set(key, 0);
      return true;
    }

    return attempts < ExponentialBackoff.MAX_ATTEMPTS;
  }

  async delay(key: string): Promise<void> {
    const attempts = this.attempts.get(key) || 0;
    const delay = Math.min(
      ExponentialBackoff.BASE_DELAY * Math.pow(2, attempts),
      ExponentialBackoff.MAX_DELAY
    );

    // Add jitter (random variance up to 20%)
    const jitter = delay * 0.2 * Math.random();
    const finalDelay = delay + jitter;

    this.attempts.set(key, attempts + 1);
    this.lastAttempt.set(key, Date.now());

    await new Promise(resolve => setTimeout(resolve, finalDelay));
  }

  reset(key: string): void {
    this.attempts.delete(key);
    this.lastAttempt.delete(key);
  }

  getAttempts(key: string): number {
    return this.attempts.get(key) || 0;
  }
}

// Global backoff instance
export const backoff = new ExponentialBackoff();

// Helper for request queuing
export class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private delay: number;

  constructor(delayMs = 500) {
    this.delay = delayMs;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        // Wait between requests to avoid overwhelming the API
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      }
    }

    this.isProcessing = false;
  }

  clear(): void {
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }
}

// Export cache management functions
export const cacheManager = {
  clear: () => apiCache.clear(),
  getStats: () => apiCache.getStats(),
  
  // Cache management for specific data types
  clearPosts: () => {
    const stats = apiCache.getStats();
    apiCache.clear(); // For now, just clear everything
    console.log('Cache cleared, stats before clear:', stats);
  },

  clearComments: () => {
    // In a more sophisticated implementation, we'd have key prefixes
    // For now, just clear everything
    apiCache.clear();
  },
};