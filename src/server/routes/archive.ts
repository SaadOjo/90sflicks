/// <reference types="@cloudflare/workers-types" />

import { Hono, type Context } from 'hono';
import { z } from 'zod';
import type { Env } from '../env';
import { getArchiveFacets, getArchiveMovieById, getArchiveMovies, parseArchiveFilters } from '../lib/archive';

const movieIdSchema = z.coerce.number().int().positive();

export function createArchiveRoutes() {
  const app = new Hono<Env>();

  const facetsHandler = async (c: Context<Env>) => {
    const filters = parseArchiveFilters(new URL(c.req.url));
    const response = await getArchiveFacets(c.env.DB, filters);
    c.header('Cache-Control', 'no-store');
    return c.json(response);
  };

  app.get('/movies', async (c) => {
    const filters = parseArchiveFilters(new URL(c.req.url));
    const response = await getArchiveMovies(c.env.DB, filters);
    c.header('Cache-Control', 'no-store');
    return c.json(response);
  });

  app.get('/movies/:id', async (c) => {
    const parsed = movieIdSchema.safeParse(c.req.param('id'));
    if (!parsed.success) {
      return c.json({ error: 'Invalid movie id' }, 400);
    }

    const movie = await getArchiveMovieById(c.env.DB, parsed.data);
    if (!movie) {
      return c.json({ error: 'Movie not found' }, 404);
    }

    c.header('Cache-Control', 'no-store');
    return c.json(movie);
  });

  app.get('/facets', facetsHandler);
  app.get('/options', facetsHandler);

  return app;
}
