import Redis from 'ioredis';
import { CacheStrategy } from './cache-strategy';

interface ValkeyConfig {
  host: string;
  port: number;
  password: string;
}

export const createValkeyCacheStrategy = (config: ValkeyConfig): CacheStrategy => {
  const client = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  client.on('error', (err) => {
    console.error('[valkeyCacheStrategy] connection error:', err.message);
  });

  const get = async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      console.error(`[valkeyCacheStrategy] get failed for key "${key}":`, err);
      return null;
    }
  };

  const set = async <T>(key: string, value: T, ttlSeconds: number): Promise<void> => {
    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.error(`[valkeyCacheStrategy] set failed for key "${key}":`, err);
    }
  };

  const del = async (key: string): Promise<void> => {
    try {
      await client.del(key);
    } catch (err) {
      console.error(`[valkeyCacheStrategy] delete failed for key "${key}":`, err);
    }
  };

  const deleteByPrefix = async (prefix: string): Promise<void> => {
    try {
      const pattern = `${prefix}*`;
      let cursor = '0';

      do {
        const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (err) {
      console.error(`[valkeyCacheStrategy] deleteByPrefix failed for prefix "${prefix}":`, err);
    }
  };

  const has = async (key: string): Promise<boolean> => {
    try {
      const exists = await client.exists(key);
      return exists === 1;
    } catch (err) {
      console.error(`[valkeyCacheStrategy] has failed for key "${key}":`, err);
      return false; // degrade toward "treat as absent" -> caller recomputes, which is safe
    }
  };

  const flush = async (): Promise<void> => {
    try {
      await client.flushdb(); // scoped to this logical DB only — never flushall
    } catch (err) {
      console.error('[valkeyCacheStrategy] flush failed:', err);
    }
  };

  const close = async (): Promise<void> => {
    await client.quit();
  };

  return { get, set, delete: del, deleteByPrefix, has, flush, close };
};