# @repo/db

Drizzle ORM schema and migrations for EventSnap. Postgres + pgvector.

## Tables

See `src/schema.ts`. Seven tables: `users`, `events`, `event_members`, `photos`, `photo_faces`, `photo_approvals`, `reports`.

## Usage

```ts
import { createDb, schema } from "@repo/db";

const db = createDb(process.env.DATABASE_URL!);
const me = await db.select().from(schema.users).where(eq(schema.users.id, userId));
```

## Migrations

See `migrations/README.md`. **Always hand-edit generated SQL** to add `CONCURRENTLY` and HNSW indexes — Drizzle doesn't do this automatically.
