import { serve } from '@hono/node-server';

import { createApp, ensureSchema } from './app';

const PORT = Number(process.env.BFF_PORT ?? 8787);

async function main() {
  await ensureSchema();
  const app = createApp();
  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`[bff] listening on :${info.port}`);
  });
}

main().catch((err: unknown) => {
  console.error('[bff] failed to start:', err);
  process.exit(1);
});
