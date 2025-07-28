// Simple in-memory cache for LeetCode data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlMinutes: number = 30): void {
    const now = Date.now();
    const expires = now + (ttlMinutes * 60 * 1000);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires
    });
    
    console.log(`📦 Cache SET: ${key} (expires in ${ttlMinutes}min)`);
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`📦 Cache MISS: ${key}`);
      return null;
    }
    
    if (Date.now() > entry.expires) {
      console.log(`📦 Cache EXPIRED: ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Cache HIT: ${key} (age: ${Math.round((Date.now() - entry.timestamp) / 1000)}s)`);
    return entry.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
    console.log(`📦 Cache DELETE: ${key}`);
  }
  
  clear(): void {
    this.cache.clear();
    console.log('📦 Cache CLEARED');
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Global cache instance
export const dataCache = new MemoryCache();

// Helper function for generating cache keys
export function getCacheKey(type: string, identifier: string): string {
  return `${type}:${identifier}`;
}

// LeetCode specific cache helpers
export function cacheLeetCodeData(username: string, data: any, ttlMinutes: number = 15): void {
  dataCache.set(getCacheKey('leetcode', username), data, ttlMinutes);
}

export function getCachedLeetCodeData(username: string): any | null {
  return dataCache.get(getCacheKey('leetcode', username));
}

export function clearLeetCodeCache(username: string): void {
  dataCache.delete(getCacheKey('leetcode', username));
}
