# @eventsnap/web

Next.js 15 (App Router) — the mobile-first PWA for EventSnap.

## Dev

```bash
# from repo root
npm install
cp apps/web/.env.example apps/web/.env.local
# fill in DATABASE_URL etc.
npm run dev --workspace=web
```

Visit http://localhost:3000.

## Health check

```
GET /api/health  →  { ok: true, service: "web", ts: <epoch> }
```

## Structure

```
src/
  app/
    layout.tsx       Root layout, PWA metadata
    page.tsx         Landing
    globals.css      Tailwind
    api/
      health/route.ts
```
