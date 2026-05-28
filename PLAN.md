# EventSnap MVP Plan

> Owner: solo founder · Target: 12 weeks to first paying event · Last updated: 2026-05-28

## Product in one sentence

Upload photos to an event; everyone whose face appears in them automatically gets their photos, with privacy controls.

## Scope decision

To hit a realistic 12-week solo MVP, **defer these to v2** (with rationale):

| Deferred                            | Why it's OK                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Apple Sign-In                       | Only needed for native iOS app, which is also v2. PWA installs fine without it.   |
| Public event discovery              | QR + invite link + organizer-added list covers 95% of real launch flows.          |
| In-app deletion-request workflow    | v1 ships a "Report this photo" form that emails the organizer. Manual is fine.    |
| Per-photo hide-from-specific-person | Ship "hide from everyone" only. Per-person hide is rare and adds UX complexity.   |
| Vendor/sponsor role                 | Treat them as guests in v1; dedicated role in v2.                                 |
| Native mobile apps                  | Mobile-first PWA covers iOS + Android with one codebase. Native after revenue.    |

**Committed v1 scope:** phone OTP + Google + email auth · QR + invite link + organizer-added join · per-event upload settings · approval before distribution · hide-from-everyone · "report this photo" form · batch processing (≤ 6h SLA) · selfie-at-signup face enrollment.

## Tech stack

```
apps/
  web/          Next.js 15 (App Router) — mobile-first PWA. Frontend + API routes.
  worker/       Python 3.12 + FastAPI sidecar + RQ/Celery worker. InsightFace inference.
packages/
  ui/           Existing — shared React components.
  db/           Drizzle schema + migrations (Postgres + pgvector).
  contracts/    Shared types: Zod schemas on Node side, Pydantic mirrors on Python.
  eslint-config, typescript-config — keep as-is.
```

- **DB:** Postgres + `pgvector` extension. Hosted: Supabase (free → $25 Pro) or Neon.
- **Storage:** Cloudflare R2 (S3-compatible, zero egress fees).
- **Queue:** Redis (Upstash free tier or self-hosted on the Hetzner box).
- **Hosting:** Vercel for `web` (free hobby tier OK for MVP), Hetzner CX22 (€4.5/mo) for `worker` + Redis.
- **Auth:** Auth.js (NextAuth) with Google + email providers + custom phone-OTP provider backed by MSG91.
- **Face stack:** `insightface` (buffalo_l model, CPU) → ArcFace 512-d embedding → pgvector HNSW index, cosine distance, threshold ~0.4.

## Data model (sketch)

```
users           id, phone, email, name, selfie_url, face_embedding (vector 512), created_at
events          id, owner_id, name, code, qr_token, starts_at, ends_at, upload_policy_json
event_members   event_id, user_id, role (owner|photographer|guest), joined_at
photos          id, event_id, uploader_id, storage_key, exif_stripped, status (pending|ready|hidden|reported), uploaded_at
photo_faces     id, photo_id, bbox_json, embedding (vector 512), matched_user_id (nullable), match_distance
photo_approvals user_id, photo_id, status (pending|approved|hidden), decided_at
reports         photo_id, reporter_id, reason, status, created_at
```

Indexes that matter: `photo_faces (embedding)` HNSW; `photo_approvals (user_id, status)` for the gallery query; `users (face_embedding)` HNSW for signup-time duplicate detection.

## Pipeline (the only complex part)

```
Upload                Worker (background)                            Read
─────────             ──────────────────────────────────────────     ────────────────
1. POST /upload  →    2. enqueue job(photo_id)                       6. GET /my-photos
2. R2 PUT             3. download photo, strip EXIF, generate thumb     → join photo_approvals
3. status=pending     4. detect faces → embeddings                        on user_id, status=approved
                      5. for each face: pgvector kNN on users               OR auto-approved
                         match if distance < 0.4
                         insert photo_approvals(status=pending)
                         OR status=approved if user has "auto-approve" on
```

Batch SLA: ≤ 6 hours. On CPU, ~5000 photos processes in ~30–60 min. Easy.

## 12-week phase plan

**Phase 1 — Foundation (Weeks 1–2)**
- Reset monorepo: scaffold `apps/web` (Next.js 15), `apps/worker` (Python + FastAPI), `packages/db`.
- Postgres + pgvector set up locally and on Supabase. First migration.
- Auth.js wired with Google + email. (Phone OTP in Phase 2.)
- Deployable hello-world on Vercel + Hetzner.

**Phase 2 — Auth & enrollment (Weeks 3–4)**
- Phone OTP via MSG91 custom Auth.js provider.
- Selfie capture screen → upload → enroll face embedding.
- Duplicate-face detection at signup (reject if embedding matches existing user > 0.5).
- Account settings: name, photo, auto-approve toggle.

**Phase 3 — Events & joining (Weeks 5–6)**
- Create event flow (name, dates, upload policy).
- Three join methods: QR token, invite code link, organizer pre-add by phone/email.
- Event landing page (member list, settings tab for owner).

**Phase 4 — Upload & pipeline (Weeks 7–9) ← the hardest weeks**
- Chunked/resumable upload to R2 (use uppy.io or tus protocol).
- EXIF stripping, thumbnail generation.
- Python worker: InsightFace inference, embedding storage, kNN matching.
- Auto-create pending `photo_approvals` rows for each matched user.

**Phase 5 — Gallery & privacy (Weeks 10–11)**
- "My photos" gallery (paginated, infinite scroll).
- Approval inbox (pending photos to review before they appear).
- Hide-from-everyone action.
- "Report this photo" form → email organizer.

**Phase 6 — Polish & first event (Week 12)**
- PWA manifest + install prompt + offline-friendly upload queue.
- Empty/loading/error states.
- Privacy policy + ToS + DPDP-style consent on signup.
- Run a real event end-to-end (yours or a friend's wedding/party).

## First-week concrete tasks

1. `git rm` the deleted `apps/docs` and `apps/web` directories (already staged), commit.
2. Scaffold new `apps/web` with `npx create-next-app@latest --typescript --app --tailwind --src-dir`.
3. Scaffold `apps/worker` with Python 3.12, `uv` for deps, FastAPI + RQ.
4. Create `packages/db` with Drizzle + Postgres. Write the schema above. Run first migration on local Postgres + pgvector.
5. Stand up Supabase project, hook up DATABASE_URL.
6. Deploy a hello-world `apps/web` to Vercel; deploy worker to Hetzner via Docker.

## Risks & mitigations

- **Face recognition accuracy on real Indian wedding lighting.** *Mitigate:* test with 200 real photos before Phase 5. Tune threshold per market if needed.
- **Storage cost spike on first viral event.** *Mitigate:* R2 has no egress fees; cap free tier events at 500 photos.
- **OTP fraud / abuse.** *Mitigate:* MSG91 has rate limits; add Cloudflare Turnstile on signup.
- **Solo burnout on 12-week sprint.** *Mitigate:* the deferred list above is real. Cut more if needed, not less.

## Open decisions (revisit in Phase 1)

- Launch market (India vs US vs both). Affects compliance scaffolding and OTP provider choice.
- Pricing model. Doesn't block dev — decide before Phase 6.
- Photo retention policy. Pick "90 days free / unlimited paid" or similar before Phase 5.
