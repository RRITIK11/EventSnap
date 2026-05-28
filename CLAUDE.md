# EventSnap — Project Context for Claude Code

This file is auto-loaded on every session. Read it before doing anything in this repo.

## What EventSnap is

A **commercial** (not academic, despite the `MajorProject` folder name) event-photo platform. One selfie at signup → upload any event photos → background pipeline auto-routes each photo to the people whose faces appear in it. Privacy controls: approval before distribution, hide-from-everyone, photo deletion requests.

Multi-stakeholder: organizers, photographers, guests, vendors. All use the same product; roles differ per event.

**Current phase:** Phase 1 (foundation) — scaffolding done, no real auth/upload/face logic yet. See `PLAN.md` for the 12-week, 6-phase plan.

## Stack at a glance

| Layer            | Choice                                 | Why                                           |
| ---------------- | -------------------------------------- | --------------------------------------------- |
| Monorepo         | Turborepo + npm workspaces             | Inherited; works                              |
| Web              | Next.js 15 (App Router) — PWA          | One codebase for iOS+Android, no app stores   |
| Worker           | Python 3.12, FastAPI + RQ              | InsightFace is Python-first                   |
| DB               | Postgres + pgvector (Supabase or Neon) | ArcFace embeddings live here as `vector(512)` |
| Storage          | Cloudflare R2 (S3-compatible)          | Zero egress fees                              |
| Queue            | Redis (Upstash) + RQ                   | Simple, durable                               |
| Face recognition | `insightface` buffalo_l, CPU at MVP    | Self-hosted; no per-call cost                 |
| Auth             | Auth.js + Google + MSG91 phone OTP     | India launch likely                           |
| Processing model | **Batch**, ≤ 6h SLA                    | Deliberately not real-time — simpler infra    |

## Repo layout

```
apps/
  web/        Next.js 15 PWA. App Router under src/app/. Health: GET /api/health.
  worker/     Python service. FastAPI in main.py, RQ worker in worker.py.
              Two processes, same image; deploy chooses which command runs.
packages/
  db/         Drizzle schema for 7 tables. Custom vector(n) type in src/vector.ts.
              Migrations hand-edited for CONCURRENTLY + HNSW indexes.
  ui/         Shared React component library (turbo starter).
  eslint-config/ , typescript-config/   Shared configs.
.claude/
  agents/     Five specialist subagents — see "Subagents" below.
PLAN.md       12-week phased MVP plan with scope cuts and rationale.
```

## Common commands

All run from repo root unless noted.

```bash
# Web (Next.js)
npm install                                    # bootstraps all workspaces
npm run dev    --workspace=web                 # localhost:3000
npm run build  --workspace=web
npm run lint   --workspace=web
npm run check-types --workspace=web

# DB (Drizzle)
npm run generate --workspace=@repo/db          # writes migrations/*.sql — HAND-EDIT before applying
npm run migrate  --workspace=@repo/db          # applies migrations against DATABASE_URL
npm run studio   --workspace=@repo/db          # drizzle studio at localhost:4983

# Worker (Python — venv per-app, not workspace-managed)
cd apps/worker
python -m venv .venv && .venv/Scripts/activate    # Windows; use 'source .venv/bin/activate' elsewhere
pip install -e ".[dev]"
uvicorn eventsnap_worker.main:app --reload --port 8000     # HTTP service
python -m eventsnap_worker.worker                          # RQ consumer
```

## Critical conventions (non-negotiables)

These exist because EventSnap handles **biometric data** (face embeddings). DPDP/GDPR/BIPA treat this as sensitive. A leak is reportable.

1. **EXIF is stripped before any image becomes durable.** GPS + faces is a privacy disaster. Strip in client when possible, always strip server-side. Verify with a test.
2. **Face embeddings never leave the server in an API response.** Not in `select *`, not in admin endpoints, not in debug logs. Grep `embedding` in any response shape and flag it.
3. **Pre-signed upload URLs expire in ≤ 15 minutes.** They are credentials.
4. **Every photo read path checks `photo_approvals.status='approved'`** for the requester (or uploader-owns, or event-owns). No exceptions.
5. **Every upload endpoint consults `events.upload_policy_json`** and the requester's `event_members.role` before issuing a pre-signed URL.
6. **Soft delete via `status='deleted'`**, never `DELETE FROM photos`. Hard delete only after a 90-day retention grace.
7. **Migrations are hand-edited.** Drizzle generates a starting point; you add `CREATE EXTENSION vector;` (first migration only), swap `CREATE INDEX` → `CREATE INDEX CONCURRENTLY` on any table > 10k rows, and append HNSW indexes for vector columns (see `packages/db/migrations/README.md`).
8. **Match threshold changes need before/after recall/precision** on a held-out set of ≥100 photos / ≥20 identities. Threshold is `0.40` cosine distance to start.
9. **Job idempotency.** The same `photo_id` enqueued twice must produce exactly one set of `photo_faces` rows. Use `ON CONFLICT (photo_id, face_index) DO NOTHING` or job-key locks.
10. **No model weights, embeddings dumps, or `.env` files in git.** `.gitignore` blocks `*.npy`, `*.pkl`, `*.onnx`, `*.pt`, `models/`, `embeddings/`, `storage/`, `.env`, `.env.local`. `.env.example` is allowed and *required*.

## Subagents — when to invoke each

Five live in `.claude/agents/`. Invoke via the Agent tool with `subagent_type` matching the file name (no extension).

| Agent                       | When                                                                              |
| --------------------------- | --------------------------------------------------------------------------------- |
| `face-pipeline-expert`      | Any change in `apps/worker/` or matching/threshold/embedding logic                |
| `privacy-auditor`           | **Before merging** anything touching photos, faces, sharing, or access control    |
| `db-schema-architect`       | Any schema change or migration authoring in `packages/db/`                        |
| `upload-pipeline-engineer`  | Upload endpoints, pre-signed URLs, EXIF strip, thumbnail gen, R2 work             |
| `secure-push`               | **Before `git push`** to any remote. Scans for secrets/keys/embedding dumps, then pushes. Refuses on findings. |

`privacy-auditor` is read-only — it reviews, the human applies fixes. The others can edit code.

## Where to find more context

- `PLAN.md` — 12-week phased build plan with the deferred-to-v2 list and rationale.
- `apps/worker/README.md` — worker-specific dev setup, model installation notes.
- `packages/db/migrations/README.md` — how to hand-edit migrations correctly.
- `packages/db/src/schema.ts` — the canonical data model (7 tables).
- `.claude/agents/*.md` — each subagent's system prompt; useful even when not invoking the agent (they document the rules).

## Decisions still open

These do not block development but must be answered before Phase 6 (first paying event):

- **Launch market:** India vs. US/EU vs. global. Affects OTP provider, consent text, and which compliance regime (DPDP / BIPA / GDPR) we draft for.
- **Pricing model:** organizer pays per event vs. subscription vs. freemium. Not picked.
- **Photo retention:** likely "90 days free / unlimited paid" but not confirmed.

When you (Claude) hit a question that depends on these, **ask the user** rather than guessing.

## Working style for this project

- **Solo founder, 2–3 month MVP target.** Scope discipline matters more than completeness. Flag overscoping early.
- **No designs yet.** Propose UX as concrete sketches (ASCII layouts, component-level pseudocode) before writing screens.
- **The founder defers to recommendations** when given them with reasoning. Make decisive calls, not menus of options. He'll push back if he disagrees.
- **Never push code anywhere automatically.** Always invoke `secure-push` (which then asks for confirmation on suspicious findings).
