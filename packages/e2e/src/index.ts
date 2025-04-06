import { DurableObject } from "cloudflare:workers";
import { Cacheable } from "web-worker-memoize";

export class Counter extends DurableObject {
  count = 0;

  @Cacheable({
    ttl: 5,
    debug: true,
  })
  getCachedCount() {
    this.count++;
    return this.count;
  }

  getRawCount() {
    this.count++;
    return this.count;
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const id = env.Counter.idFromName("SINGLETON");
    const counter = env.Counter.get(id);

    if (request.url.includes("cache")) {
      return Response.json({ cached: await counter.getCachedCount() });
    }

    return Response.json({ raw: await counter.getRawCount() });
  },
} satisfies ExportedHandler<Env>;
