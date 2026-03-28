import { Hono } from 'hono';
import type { Env } from './env';
import { createArchiveRoutes } from './routes/archive';
import { createSearchIndexRoutes } from './routes/searchIndex';

const app = new Hono<Env>();

app.get('/api/health', (c) => c.json({ ok: true }));
app.route('/api/archive', createArchiveRoutes());
app.route('/api/search-index', createSearchIndexRoutes());

export default app;
