import NodeCache from 'node-cache';
import { CacheStrategy } from './cache-strategy';

export const createMemoryCacheStrategy = (): CacheStrategy => {
  const store = new NodeCache({ useClones: false });

  const get = async <T>(key: string): Promise<T | null> => {
    const value = store.get<T>(key);
    return value === undefined ? null : value;
  };

  const set = async <T>(key: string, value: T, ttlSeconds: number): Promise<void> => {
    store.set(key, value, ttlSeconds);
  };

  const del = async (key: string): Promise<void> => {
    store.del(key);
  };

  const deleteByPrefix = async (prefix: string): Promise<void> => {
    const matchingKeys = store.keys().filter((key) => key.startsWith(prefix));
    if (matchingKeys.length > 0) {
      store.del(matchingKeys);
    }
  };

  const has = async (key: string): Promise<boolean> => {
    return store.has(key);
  };

  const flush = async (): Promise<void> => {
    store.flushAll();
  };

  const close = async (): Promise<void> => {
    store.flushAll();
    store.close();
  };

  return { get, set, delete: del, deleteByPrefix, has, flush, close };
};