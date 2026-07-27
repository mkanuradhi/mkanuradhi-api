import logger from '../config/logger-config';
import { CacheStrategy } from './cache-strategy';
import { createMemoryCacheStrategy } from './memory-cache-strategy';
import { createValkeyCacheStrategy } from './valkey-cache-strategy';

let instance: CacheStrategy | null = null;

export const getCacheStrategy = (): CacheStrategy => {
  if (instance) return instance;

  const strategy = process.env.CACHE_STRATEGY ?? 'memory';

  if (strategy === 'valkey') {
    instance = createValkeyCacheStrategy({
      host: process.env.VALKEY_HOST ?? 'localhost',
      port: Number(process.env.VALKEY_PORT ?? 6379),
      password: process.env.VALKEY_PASSWORD ?? '',
    });
  } else {
    instance = createMemoryCacheStrategy();
  }

  logger.info(`[cacheFactory] using "${strategy}" cache strategy`);
  return instance;
};