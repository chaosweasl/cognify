/**
 * Cache-First Data Access System for Cognify
 * 
 * Multi-layer caching implementation with TTL, versioning, and automatic cleanup
 * Prevents N+1 queries and provides development utilities for debugging
 * 
 * Core features:
 * - TTL-based cache expiration
 * - Version-based cache invalidation
 * - Automatic cleanup every 5 minutes
 * - Development mode debugging utilities
 * - Batch operation support
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Cache entry interface with metadata
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
  key: string;
}

// Cache configuration options
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  version?: number; // Cache version for invalidation (default: 1)
  force?: boolean; // Force refresh regardless of cache (default: false)
}

// Cache store interface
interface CacheStore {
  cache: Map<string, CacheEntry>;
  globalVersion: number;
  
  // Core cache operations
  set: <T>(key: string, data: T, options?: CacheOptions) => void;
  get: <T>(key: string) => T | null;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
  
  // Cache management
  invalidateByPattern: (pattern: string) => void;
  invalidateByVersion: (version: number) => void;
  incrementGlobalVersion: () => void;
  cleanup: () => void;
  
  // Debug utilities
  getStats: () => CacheStats;
  getAllKeys: () => string[];
  getCacheSize: () => number;
}

// Cache statistics for debugging
interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  expiredEntries: number;
  averageAge: number;
}

// Default cache TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Create the cache store with zustand
const useCacheStore = create<CacheStore>()(
  subscribeWithSelector((set, get) => ({
    cache: new Map(),
    globalVersion: 1,
    
    set: <T>(key: string, data: T, options: CacheOptions = {}) => {
      const { ttl = DEFAULT_TTL, version = 1 } = options;
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version,
        key,
      };
      
      set((state) => {
        const newCache = new Map(state.cache);
        newCache.set(key, entry);
        return { cache: newCache };
      });
      
      // Log cache set in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Cache SET: ${key} (TTL: ${ttl}ms, Version: ${version})`);
      }
    },
    
    get: <T>(key: string): T | null => {
      const { cache, globalVersion } = get();
      const entry = cache.get(key) as CacheEntry<T> | undefined;
      
      if (!entry) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ Cache MISS: ${key}`);
        }
        return null;
      }
      
      const now = Date.now();
      const isExpired = now - entry.timestamp > entry.ttl;
      const isVersionStale = entry.version < globalVersion;
      
      if (isExpired || isVersionStale) {
        // Remove expired/stale entry
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.delete(key);
          return { cache: newCache };
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏰ Cache EXPIRED: ${key} (${isExpired ? 'TTL' : 'Version'})`);
        }
        return null;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Cache HIT: ${key}`);
      }
      
      return entry.data;
    },
    
    has: (key: string): boolean => {
      return get().get(key) !== null;
    },
    
    delete: (key: string): void => {
      set((state) => {
        const newCache = new Map(state.cache);
        newCache.delete(key);
        return { cache: newCache };
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ Cache DELETE: ${key}`);
      }
    },
    
    clear: (): void => {
      set({ cache: new Map() });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Cache CLEARED');
      }
    },
    
    invalidateByPattern: (pattern: string): void => {
      set((state) => {
        const newCache = new Map(state.cache);
        const regex = new RegExp(pattern);
        let deletedCount = 0;
        
        for (const key of newCache.keys()) {
          if (regex.test(key)) {
            newCache.delete(key);
            deletedCount++;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Cache INVALIDATE PATTERN: ${pattern} (${deletedCount} entries)`);
        }
        
        return { cache: newCache };
      });
    },
    
    invalidateByVersion: (version: number): void => {
      set((state) => {
        const newCache = new Map(state.cache);
        let deletedCount = 0;
        
        for (const [key, entry] of newCache.entries()) {
          if (entry.version <= version) {
            newCache.delete(key);
            deletedCount++;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Cache INVALIDATE VERSION: ${version} (${deletedCount} entries)`);
        }
        
        return { cache: newCache };
      });
    },
    
    incrementGlobalVersion: (): void => {
      set((state) => ({ globalVersion: state.globalVersion + 1 }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⬆️ Cache GLOBAL VERSION: ${get().globalVersion}`);
      }
    },
    
    cleanup: (): void => {
      const now = Date.now();
      let deletedCount = 0;
      
      set((state) => {
        const newCache = new Map(state.cache);
        
        for (const [key, entry] of newCache.entries()) {
          if (now - entry.timestamp > entry.ttl) {
            newCache.delete(key);
            deletedCount++;
          }
        }
        
        return { cache: newCache };
      });
      
      if (process.env.NODE_ENV === 'development' && deletedCount > 0) {
        console.log(`🧹 Cache CLEANUP: ${deletedCount} expired entries removed`);
      }
    },
    
    getStats: (): CacheStats => {
      const { cache } = get();
      const now = Date.now();
      let totalSize = 0;
      let expiredEntries = 0;
      let totalAge = 0;
      
      for (const entry of cache.values()) {
        totalSize += JSON.stringify(entry.data).length;
        totalAge += now - entry.timestamp;
        
        if (now - entry.timestamp > entry.ttl) {
          expiredEntries++;
        }
      }
      
      return {
        totalEntries: cache.size,
        totalSize,
        hitRate: 0, // Would need hit/miss tracking for accurate calculation
        expiredEntries,
        averageAge: cache.size > 0 ? totalAge / cache.size : 0,
      };
    },
    
    getAllKeys: (): string[] => {
      return Array.from(get().cache.keys());
    },
    
    getCacheSize: (): number => {
      return get().cache.size;
    },
  }))
);

// Main cache function - the primary interface for cache-first data access
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const store = useCacheStore.getState();
  const { force = false } = options;
  
  // Check cache first (unless force refresh)
  if (!force) {
    const cached = store.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }
  
  // Fetch data and cache it
  try {
    const data = await fetcher();
    store.set(key, data, options);
    return data;
  } catch (error) {
    console.error(`❌ Cache fetch error for key "${key}":`, error);
    throw error;
  }
}

// Cache invalidation utilities
export const CacheInvalidation = {
  // Invalidate specific key
  invalidate: (key: string) => {
    useCacheStore.getState().delete(key);
  },
  
  // Invalidate by pattern (e.g., "projects_*")
  invalidatePattern: (pattern: string) => {
    useCacheStore.getState().invalidateByPattern(pattern);
  },
  
  // Invalidate all project-related cache
  invalidateProjects: () => {
    useCacheStore.getState().invalidateByPattern('projects');
  },
  
  // Invalidate all user-related cache
  invalidateUserData: (userId?: string) => {
    const pattern = userId ? `user_${userId}` : 'user_';
    useCacheStore.getState().invalidateByPattern(pattern);
  },
  
  // Global cache invalidation (increments global version)
  invalidateAll: () => {
    useCacheStore.getState().incrementGlobalVersion();
  },
  
  // Clear entire cache
  clear: () => {
    useCacheStore.getState().clear();
  },
};

// Hook for accessing cache utilities in components
export const useCacheUtilities = () => {
  const store = useCacheStore();
  
  return {
    // Cache statistics
    stats: store.getStats(),
    size: store.getCacheSize(),
    keys: store.getAllKeys(),
    
    // Manual cache operations
    invalidate: CacheInvalidation.invalidate,
    invalidatePattern: CacheInvalidation.invalidatePattern,
    clear: CacheInvalidation.clear,
    
    // Force cleanup
    cleanup: store.cleanup,
  };
};

// Automatic cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().cleanup();
  }, 5 * 60 * 1000);
  
  // Make cache available in development for debugging
  if (process.env.NODE_ENV === 'development') {
    (window as any).cognifyCache = {
      store: useCacheStore,
      utils: CacheInvalidation,
      stats: () => useCacheStore.getState().getStats(),
      keys: () => useCacheStore.getState().getAllKeys(),
    };
  }
}

export { useCacheStore };