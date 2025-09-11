// Cache utility for frontend data caching
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheConfig {
  userProfile: number; // 30 minutes
  jobsList: number;    // 5 minutes
  jobDetails: number;  // 10 minutes
  jobLogs: number;     // 2 minutes
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private config: CacheConfig = {
    userProfile: 30 * 60 * 1000,  // 30 minutes
    jobsList: 5 * 60 * 1000,      // 5 minutes
    jobDetails: 10 * 60 * 1000,   // 10 minutes
    jobLogs: 2 * 60 * 1000,       // 2 minutes
  };

  // Generate cache key
  private getKey(type: string, identifier?: string): string {
    return identifier ? `${type}:${identifier}` : type;
  }

  // Check if item is expired
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // Get item from cache
  get<T>(type: string, identifier?: string): T | null {
    const key = this.getKey(type, identifier);
    
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data;
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const item: CacheItem<T> = JSON.parse(stored);
        if (!this.isExpired(item)) {
          // Restore to memory cache
          this.memoryCache.set(key, item);
          return item.data;
        } else {
          // Remove expired item
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  // Set item in cache
  set<T>(type: string, data: T, identifier?: string, customTtl?: number): void {
    const key = this.getKey(type, identifier);
    const ttl = customTtl || this.config[type as keyof CacheConfig] || 5 * 60 * 1000;
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory cache
    this.memoryCache.set(key, item);

    // Store in localStorage
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  }

  // Remove item from cache
  remove(type: string, identifier?: string): void {
    const key = this.getKey(type, identifier);
    
    // Remove from memory cache
    this.memoryCache.delete(key);
    
    // Remove from localStorage
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    
    try {
      // Remove all cache items from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(':') || ['userProfile', 'jobsList'].includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Invalidate related cache items
  invalidate(type: string, identifier?: string): void {
    if (type === 'jobsList') {
      // When jobs list changes, invalidate all job details
      this.memoryCache.forEach((_, key) => {
        if (key.startsWith('jobDetails:')) {
          this.memoryCache.delete(key);
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
          }
        }
      });
    }
    
    if (type === 'jobDetails' && identifier) {
      // When job details change, invalidate related logs
      this.remove('jobLogs', identifier);
    }

    // Remove the specific item
    this.remove(type, identifier);
  }

  // Clean expired items
  cleanup(): void {
    // Clean memory cache
    this.memoryCache.forEach((item, key) => {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    });

    // Clean localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(':') || ['userProfile', 'jobsList'].includes(key)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const item: CacheItem<any> = JSON.parse(stored);
              if (this.isExpired(item)) {
                localStorage.removeItem(key);
              }
            } catch (error) {
              // Remove invalid items
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

// Create singleton cache instance
export const cache = new CacheManager();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Cache types for type safety
export const CACHE_TYPES = {
  USER_PROFILE: 'userProfile',
  JOBS_LIST: 'jobsList',
  JOB_DETAILS: 'jobDetails',
  JOB_LOGS: 'jobLogs',
} as const;

export type CacheType = typeof CACHE_TYPES[keyof typeof CACHE_TYPES];