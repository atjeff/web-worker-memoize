/**
 * Options for the Cacheable decorator
 */
type CacheableOptions = {
  /** Cache name to use (defaults to 'default') */
  cacheName?: string;

  /** Time-to-live in SECONDS (defaults to 3600 = 1 hour) */
  ttl?: number;

  /**
   * Custom key generation function
   * Note: The default key generator generates a key like this:
   * * `https://__MEMOIZE_CACHE__/${ClassName}:${functionName}:${serializedArgs}:${ttl}`
   * @example: https://__MEMOIZE_CACHE__/Receiver:getStats:{"page":1,"pageSize":10}:3600
   */
  keyGenerator?: (target: any, propertyKey: string, args: any[]) => string;

  /** Debug mode */
  debug?: boolean;
};

/**
 * Decorator that caches function results using the [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
 *
 * @param options Optional configuration for caching behavior
 * @returns Method decorator function
 */
export function Cacheable(options: CacheableOptions = {}) {
  const {
    cacheName = "default",
    ttl = 3600, // 1 hour
    keyGenerator = defaultKeyGenerator,
    debug = false,
  } = options;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Generate cache key based on function name and arguments
      const targetName = target?.constructor?.name || target.toString();
      const cacheKey = keyGenerator(targetName, propertyKey, args, ttl);
      const logPrefix = `[Memoize:${targetName}:${propertyKey}]`;

      try {
        // Try to get from cache first
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(cacheKey);

        // If found in cache, parse and return
        if (cachedResponse) {
          const result = await cachedResponse.json();

          if (debug) {
            console.log(`${logPrefix} cache HIT`, {
              cacheKey,
              args,
              result,
              ttl: cachedResponse.headers.get("Cache-Control"),
            });
          }

          return result;
        }

        if (debug) {
          console.log(`${logPrefix} cache MISS`, {
            cacheKey,
            args,
          });
        }

        // If not in cache, execute the original method
        const result = await originalMethod.apply(this, args);

        // Store result in cache
        const headers = new Headers({
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${ttl}`,
        });

        console.log({
          cacheKey,
          result,
          stringified: JSON.stringify(result),
          ttl,
        });
        const response = new Response(JSON.stringify(result), { headers });
        await cache.put(cacheKey, response);

        if (debug) {
          console.log(`${logPrefix} cache STORED`, {
            cacheKey,
            result,
            ttl,
          });
        }

        return result;
      } catch (error) {
        console.error(`${logPrefix} cache ERROR`, {
          cacheKey,
          error,
        });

        // Fallback to original method if caching fails
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

function defaultKeyGenerator(
  targetName: string,
  propertyKey: string,
  args: any[],
  ttl: number
): string {
  // Use Request object as cache key for compatibility with Cache API
  const serializedArgs = JSON.stringify(args);

  return new Request(
    `https://__MEMOIZE_CACHE__/${targetName}:${propertyKey}:${serializedArgs}:${ttl}`
  ).url;
}
