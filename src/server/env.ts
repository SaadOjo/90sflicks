/// <reference types="@cloudflare/workers-types" />

export interface Env {
  Bindings: {
    DB: D1Database;
  };
}
