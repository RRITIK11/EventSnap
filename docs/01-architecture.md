# Architecture — Current state (Phase 1)

This is what's actually running. Future phases extend it; see [PLAN.md](../PLAN.md).

## The big picture

```
┌─────────────────────────────────────────────────────────────────────┐
│ User's phone (browser)                                              │
│   apps/web — Next.js 15 PWA                                         │
│   ├─ Pages: /, /sign-in, /sign-up, /dashboard                       │
│   ├─ Server actions: sign-up, sign-in, sign-out                     │
│   └─ Middleware: gates /dashboard via Auth.js authorized callback   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS (localhost in dev)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ apps/web (Next.js server runtime)                                   │
│   ├─ Auth.js v5 — Credentials + Google providers, JWT sessions      │
│   ├─ Drizzle adapter — writes accounts/verification_tokens          │
│   ├─ src/lib/db.ts — singleton postgres-js client                   │
│   └─ src/lib/password.ts — bcrypt (cost 12)                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ postgres-js (port 5432)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Postgres 16 + pgvector 0.8.1 (Docker: eventsnap-postgres)           │
│   9 tables: users, events, event_members, photos, photo_faces,     │
│             photo_approvals, reports, accounts, verification_tokens │
│   HNSW indexes on users.face_embedding, photo_faces.embedding       │
│   (cosine ops, m=16, ef_construction=64)                            │
└─────────────────────────────────────────────────────────────────────┘

Sitting idle until Phase 4:
  • Redis (Docker: eventsnap-redis) — will hold RQ job queue
  • apps/worker (Python 3.12 + FastAPI + RQ) — will run InsightFace
```

## What's wired up

### Auth flow (Phase 1)

1. User visits `/sign-up`, enters name + email + password.
2. Server action (`apps/web/src/app/(auth)/sign-up/actions.ts`):
   - Validates with Zod.
   - Checks `users.email` for duplicate.
   - bcrypt-hashes the password (cost 12 ≈ 250ms).
   - Inserts user with `consent_version=1`, `consent_at=NOW()`.
   - Calls `signIn("credentials", ...)` to create the JWT session.
3. Browser gets the session cookie and is redirected to `/dashboard`.

For Google sign-in (when `AUTH_GOOGLE_ID`/`SECRET` are set):
1. User clicks "Continue with Google" on `/sign-in`.
2. Auth.js redirects to Google's consent screen.
3. On return, Auth.js calls Drizzle adapter to either find or create the user, then upsert an `accounts` row linking the Google profile to our user ID.
4. JWT cookie issued. Same redirect.

### Protected routes

`apps/web/src/middleware.ts` runs Auth.js's `authorized` callback before any non-public route renders. Currently only `/dashboard*` is protected; the rule is in `apps/web/src/auth.ts` (`authorized()`).

### Database

Single migration (`packages/db/migrations/0000_slippery_the_watchers.sql`):
- Creates the `vector` extension.
- Creates 4 enum types, 9 tables, all foreign keys.
- Hand-appended HNSW indexes for the two `vector(512)` columns.

Apply with: `npm run migrate --workspace=@repo/db`.

## What's NOT wired up yet

These are scaffolded but inert:

- **`apps/worker`** — FastAPI app boots, RQ worker connects to Redis. Neither does any work yet; no jobs are enqueued and no handlers are registered. **Phase 4** brings this to life.
- **Photo upload** — no endpoints, no R2 client, no tus integration. **Phase 4**.
- **Event creation / joining** — no UI, no API. **Phase 3**.
- **Selfie capture + face enrollment** — no UI, no embedding generation. **Phase 2**.
- **Phone OTP** — no MSG91 integration. **Phase 2**.
- **PWA install prompt** — manifest exists, install banner not yet wired. **Phase 6**.

## Why this layout?

Short version (full reasoning in [decisions/](decisions/)):

- **Next.js PWA** instead of native apps → one codebase for iOS+Android, no app stores. ADR-003.
- **Python worker** alongside Node web → InsightFace is Python-first; we'd lose accuracy/maintainability fighting that. The polyglot boundary is one job queue.
- **Postgres + pgvector** instead of a dedicated vector DB (Pinecone, Weaviate) → one less service to run, one less bill, no data sync. ADR-004.
- **Batch processing** (jobs, ≤ 6h SLA) instead of real-time → we don't have to autoscale the worker for upload spikes. ADR-002.
- **Self-hosted InsightFace** instead of AWS Rekognition/Face++ → costs are predictable, no vendor lock-in on the most sensitive data we'll ever hold. ADR-001.
- **JWT sessions** instead of database sessions → required by Auth.js Credentials provider, plus fewer DB round-trips per request. ADR-005 (to be written).

## File map for the curious

```
EventSnap/
├── CLAUDE.md              # Conventions, non-negotiables, command cheatsheet
├── PLAN.md                # 12-week phased build plan
├── PROGRESS.csv           # Live task tracker
├── docker-compose.yml     # Postgres + Redis for local dev
│
├── apps/
│   ├── web/                                  # Next.js PWA
│   │   ├── src/
│   │   │   ├── auth.ts                       # Auth.js v5 config
│   │   │   ├── middleware.ts                 # Protected-route gate
│   │   │   ├── lib/db.ts                     # Postgres client singleton
│   │   │   ├── lib/password.ts               # bcrypt helpers
│   │   │   ├── types/next-auth.d.ts          # Session type augmentation
│   │   │   └── app/
│   │   │       ├── layout.tsx                # Root layout + PWA metadata
│   │   │       ├── page.tsx                  # Landing
│   │   │       ├── (auth)/sign-in/page.tsx   # Sign-in form
│   │   │       ├── (auth)/sign-up/page.tsx   # Sign-up form (client)
│   │   │       ├── (auth)/sign-up/actions.ts # Server action: hash + insert
│   │   │       ├── api/auth/[...nextauth]/route.ts  # Auth.js handlers
│   │   │       ├── api/health/route.ts       # Liveness probe
│   │   │       └── dashboard/page.tsx        # Protected proof-of-session
│   │   └── public/manifest.webmanifest       # PWA manifest
│   │
│   └── worker/                               # Python — inert in Phase 1
│       └── src/eventsnap_worker/
│           ├── config.py                     # Pydantic settings
│           ├── main.py                       # FastAPI health/ready
│           └── worker.py                     # RQ consumer (no handlers)
│
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema.ts                     # All 9 tables in Drizzle
│   │   │   ├── vector.ts                     # pgvector custom column type
│   │   │   └── index.ts                      # createDb() factory
│   │   └── migrations/
│   │       ├── 0000_slippery_the_watchers.sql  # The one migration (hand-edited)
│   │       └── meta/                           # Drizzle bookkeeping
│   ├── ui/                                   # Shared React components
│   ├── eslint-config/                        # Shared ESLint flat config
│   └── typescript-config/                    # Shared tsconfig presets
│
├── .claude/agents/                           # 6 Claude subagents
│   ├── face-pipeline-expert.md
│   ├── privacy-auditor.md
│   ├── db-schema-architect.md
│   ├── upload-pipeline-engineer.md
│   ├── secure-push.md
│   └── project-tutor.md                      # ← this one is who maintains these docs
│
└── docs/                                     # You are here
    ├── README.md
    ├── 00-glossary.md
    ├── 01-architecture.md   ← THIS FILE
    └── decisions/
        ├── README.md
        ├── 001-self-hosted-face-recognition.md
        ├── 002-batch-processing-not-realtime.md
        └── 003-nextjs-pwa-not-native.md
```
