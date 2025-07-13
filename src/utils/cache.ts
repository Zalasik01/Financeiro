import { useState, useEffect, useCallback } from 'react';
import { APP_CONFIG } from '@/config/app';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LocalCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = APP_CONFIG.storage.cacheTimeout): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Limpar itens expirados periodicamente
    this.cleanup();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Informações para debug
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new LocalCache();

// Hook para usar cache com React
export function useCache<T>(key: string, ttl?: number) {
  const [cachedData, setCachedData] = useState<T | null>(() => cache.get<T>(key));

  const setCache = useCallback((data: T) => {
    cache.set(key, data, ttl);
    setCachedData(data);
  }, [key, ttl]);

  const clearCache = useCallback(() => {
    cache.delete(key);
    setCachedData(null);
  }, [key]);

  const hasCache = useCallback(() => {
    return cache.has(key);
  }, [key]);

  return {
    data: cachedData,
    setCache,
    clearCache,
    hasCache,
  };
}
