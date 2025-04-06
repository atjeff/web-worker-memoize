pnpm install
pnpm -r test
pnpm --filter web-worker-memoize run build 
cp ./README.md ./packages/web-worker-memoize/dist/README.md
pnpm publish packages/web-worker-memoize/dist