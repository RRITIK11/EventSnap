# Glossary

Terms you'll meet across the EventSnap codebase and docs. Skim or search; come back as needed.

## Face recognition

**Face embedding** — A list of 512 numbers (a "vector") that summarizes a face. Two embeddings from photos of the *same* person are *close* in the 512-dimensional space; two embeddings from *different* people are far apart. We never look at the raw face image at match time — we only compare embeddings. The embedding is irreversible: you can't reconstruct a face from it.

**ArcFace** — The specific machine-learning model that turns a face image into a 512-d embedding. State of the art for face recognition. We use it via `insightface`'s `buffalo_l` model pack (a bundle of detection + ArcFace).

**InsightFace** — The Python library that wraps face detection (find faces in an image) and ArcFace embedding (turn each face into a vector). Self-hosted, free. We run it on CPU at MVP scale.

**Face detection vs. recognition** — Detection finds *where* faces are in a photo (bounding boxes). Recognition (or "matching") figures out *who* each face is. We do both in the same worker pass.

**Cosine distance** — One way to measure how close two embeddings are. 0 = identical, 2 = opposite. ArcFace embeddings of the same person are typically < 0.4; different people are > 0.6. Our matching threshold is `< 0.4`.

**HNSW** — Hierarchical Navigable Small World. A type of index that makes "find the closest embedding to this one" queries fast. Without it, every match query would compare against every user — 50ms per photo with 10k users; with HNSW, it's 1-2ms.

## Database & storage

**pgvector** — A Postgres extension that adds the `vector(N)` column type plus operators like `<=>` (cosine distance). It's what makes Postgres viable as a vector DB without buying a separate service (Pinecone, Weaviate, etc.).

**Drizzle** — Our ORM. Lets us write schema and queries in TypeScript that compile to SQL. Chosen over Prisma because Drizzle's generated SQL is easier to hand-edit (which we need for pgvector + HNSW indexes).

**Migration** — A SQL file that changes the database schema. Numbered (`0000_…sql`, `0001_…sql`) and applied in order. We hand-edit Drizzle's generated migrations to add things it can't generate (the `vector` extension, HNSW indexes).

**R2** — Cloudflare's S3-compatible object storage. We store original photos and thumbnails here. Chosen for **zero egress fees** — guests downloading their photos doesn't cost us.

**Pre-signed URL** — A temporary, single-use URL that lets a client upload directly to R2 without our server proxying the file. The URL embeds a signature that R2 verifies. We make them expire in ≤ 15 minutes — they're effectively credentials.

## Image handling

**EXIF** — Metadata embedded in JPEG/HEIC files. Includes camera settings AND **GPS coordinates** AND timestamp. Privacy disaster if uploaded as-is — a stalker who sees a guest's photo knows exactly where the photo was taken. We strip EXIF before any photo becomes durable.

**Thumbnail** — A smaller (400px on long edge) version of a photo for fast gallery rendering. Generated server-side after EXIF strip; cached on R2.

**Tus protocol** — A resumable upload protocol. If your phone loses signal mid-upload, tus resumes from the last chunk; plain multipart starts over. Crucial for guests at a venue with flaky wifi.

## Auth

**Auth.js (next-auth v5)** — Our authentication framework. Handles OAuth (Google), email/password, JWT sessions, the whole flow. v5 is in beta but stable enough for our use case.

**JWT session** — JSON Web Token. The user's session is stored entirely in a signed cookie, not in our database. Trade-off: smaller infra (no `sessions` table to manage), but we can't invalidate a session server-side without rotating the secret.

**Drizzle Adapter** — A plug-in for Auth.js that tells it how to store users/accounts/verification_tokens in our Postgres. We use it for the OAuth bits even though sessions are JWT.

**Credentials provider** — The Auth.js bit that handles email/password. Custom-implemented (we provide a function that looks up the user and verifies the bcrypt hash).

**bcrypt** — A password hashing function designed to be slow on purpose, so brute-forcing leaked password hashes is expensive. Cost factor 12 ≈ 250ms per hash on modern hardware.

## Privacy & compliance

**DPDP Act** — India's Digital Personal Data Protection Act (2023). Treats biometric data (face embeddings count) as sensitive. Requires consent, deletion rights, breach notification.

**GDPR** — EU's General Data Protection Regulation. Similar treatment of biometric data, but with stricter consent and explicit rights to data portability.

**BIPA** — Illinois Biometric Information Privacy Act. Strictest of the three. Specifies written consent before face data collection and statutory damages for violations.

**Consent version** — A number we bump every time the privacy/consent text changes. Users who agreed to an old version need to re-consent before further biometric ops. Stored in `users.consent_version` and `users.consent_at`.

## Project structure

**Turborepo** — A monorepo tool. Lets us have `apps/web` and `apps/worker` and `packages/db` in one git repo, sharing configs.

**Workspace** — One sub-package in the monorepo (anything under `apps/` or `packages/`). Each has its own `package.json` and can depend on other workspaces via `"@repo/db": "*"`.

**PWA** — Progressive Web App. A web app that can be "installed" on a phone like a native app (icon on home screen, fullscreen mode, offline-friendly). Our `apps/web` is a PWA — that's how we ship to iOS + Android with one codebase.

## Patterns from CLAUDE.md

**Soft delete** — Mark a row as deleted (`photos.status = 'deleted'`) without actually removing it. Lets us undo deletions and audit history. Hard delete only after a 90-day grace period.

**Idempotency** — A job that can run twice with the same result as running once. Our face-processing jobs are idempotent: enqueuing the same `photo_id` twice produces exactly one set of `photo_faces` rows.

**Soft delete via tombstone** — Same as soft delete. The "tombstone" is the `status='deleted'` marker that hides the row from all read paths.
