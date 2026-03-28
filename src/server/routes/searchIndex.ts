/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono';
import type { Env } from '../env';
import { getCompanySearchIndex, getPeopleSearchIndexShard } from '../lib/searchIndex';

export function createSearchIndexRoutes() {
  const app = new Hono<Env>();

  app.get('/companies', async (c) => {
    const items = await getCompanySearchIndex(c.env.DB);
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return c.json({ items });
  });

  app.get('/people', async (c) => {
    const prefix = (c.req.query('prefix') ?? '').trim().toLowerCase().slice(0, 2);
    if (prefix.length < 2) {
      return c.json({ error: 'prefix must be at least 2 characters' }, 400);
    }

    const items = await getPeopleSearchIndexShard(c.env.DB, prefix);
    c.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return c.json({ prefix, items });
  });

  return app;
}
