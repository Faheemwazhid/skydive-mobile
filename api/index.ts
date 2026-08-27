import { handle } from 'hono/vercel';

import { createApp } from '../server/src/app';

export const config = { runtime: 'nodejs' };

/**
 * Vercel routes everything under /api here, so the app is mounted at that
 * prefix and the browser calls /api/v1/... on the same origin as the web
 * build — no CORS, one deployment.
 */
export default handle(createApp('/api'));
