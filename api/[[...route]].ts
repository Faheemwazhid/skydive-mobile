import { handle } from 'hono/vercel';

import { createApp } from '../server/src/app';

export const config = { runtime: 'nodejs' };

/**
 * A catch-all so Vercel routes every /api/* path here itself. An `index.ts`
 * would only answer `/api`, and a rewrite pointing /api/(.*) back at /api
 * loops until the request times out.
 *
 * The app is mounted at /api so the browser calls it on the same origin as the
 * web build — no CORS, one deployment.
 */
export default handle(createApp('/api'));
