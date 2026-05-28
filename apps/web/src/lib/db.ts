import { createDb } from "@repo/db";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

// Reuse the client across hot reloads in dev to avoid exhausting connections.
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDb> | undefined;
}

export const db = globalThis.__db ?? createDb(url);
if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
