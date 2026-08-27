import { getRequestListener } from '@hono/node-server';

import { createApp } from '../server/src/app';

export const config = { runtime: 'nodejs' };

/**
 * Every /api/* path is rewritten to this one function by vercel.json.
 *
 * Filename catch-alls were tried first and do not work here: with a custom
 * build command Vercel only routed single-segment paths such as /api/health to
 * them, and anything deeper got Vercel's own 404 without reaching the app. An
 * explicit rewrite is unambiguous.
 *
 * `getRequestListener` — not `hono/vercel` — is what bridges Hono to this
 * runtime. Vercel's Node functions are handed Node's (req, res); the
 * `hono/vercel` adapter targets the Edge runtime's Request/Response pair and
 * on Node it simply never writes a response, so requests hang.
 *
 * The app is mounted at /api so the browser calls it on the same origin as the
 * web build — no CORS, one deployment.
 */
export default getRequestListener(createApp('/api').fetch);
