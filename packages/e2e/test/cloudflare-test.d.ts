declare module "cloudflare:test" {
  export const SELF: {
    fetch: typeof fetch;
  };
}
