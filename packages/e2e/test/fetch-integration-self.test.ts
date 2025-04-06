import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

it("properly caches results", async () => {
  const response1 = await SELF.fetch("http://example.com/cache");
  expect(await response1.json()).toEqual({ cached: 1 });

  const response2 = await SELF.fetch("http://example.com/cache");
  expect(await response2.json()).toEqual({ cached: 1 });
});

it("doesn't cache raw results", async () => {
  const response1 = await SELF.fetch("http://example.com/raw");
  expect(await response1.json()).toEqual({ raw: 1 });

  const response2 = await SELF.fetch("http://example.com/raw");
  expect(await response2.json()).toEqual({ raw: 2 });
});
