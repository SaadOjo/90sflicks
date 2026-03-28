import { Hono } from 'hono';

export interface Env {
  Bindings: {
    DB: D1Database;
  };
}

const app = new Hono<Env>();

app.get('/api/health', (c) => c.json({ ok: true }));

export default app;
