# @eventsnap/web

Next.js 15 (App Router) — the mobile-first PWA for EventSnap.

## Phase 1 quickstart

```bash
# from repo root
docker compose up -d                            # starts Postgres + pgvector and Redis
npm install                                     # bootstrap workspaces
cp apps/web/.env.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env

# Pick a random AUTH_SECRET (any 32+ char string works in dev):
#   openssl rand -base64 32
# Edit apps/web/.env.local and paste it.

npm run generate --workspace=@repo/db           # generates the first migration SQL
# Review packages/db/migrations/*.sql — it already includes pgvector + HNSW.
npm run migrate --workspace=@repo/db            # applies it

npm run dev --workspace=web                     # http://localhost:3000
```

Sign up at `/sign-up` with an email and 8+ char password. You'll be redirected to `/dashboard`.

## Routes

| Path               | Auth     | Purpose                                          |
| ------------------ | -------- | ------------------------------------------------ |
| `/`                | Optional | Landing — links to sign-in / sign-up / dashboard |
| `/sign-in`         | Public   | Email+password sign-in, plus Google button       |
| `/sign-up`         | Public   | Create account with email+password               |
| `/dashboard`       | Required | Proof-of-session page (redirects to `/sign-in`)  |
| `/api/health`      | Public   | `{ ok: true }`                                   |
| `/api/auth/*`      | Public   | Auth.js handlers                                 |

## Adding Google sign-in later

1. Create OAuth credentials at https://console.cloud.google.com (Web app, redirect URI `http://localhost:3000/api/auth/callback/google`).
2. Paste `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` into `apps/web/.env.local`.
3. Restart `npm run dev`. The "Continue with Google" button now works.

## Tech notes

- **JWT sessions**, not database sessions — required by Credentials provider in Auth.js v5.
- **Drizzle adapter** is wired so OAuth (Google) still creates an `accounts` row for linking.
- **Middleware** at `src/middleware.ts` runs the `authorized` callback before any non-public route renders.
- The `auth.ts` config is reused both as the NextAuth instance (for route handlers and server actions) and as the middleware config — they need to stay in sync.
