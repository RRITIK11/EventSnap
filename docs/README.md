# EventSnap Docs

Explanatory documentation for the EventSnap project. Maintained by the `project-tutor` Claude agent (invoke it to extend/refresh these docs).

## Read these in order if you're new

1. [Glossary](00-glossary.md) — jargon used across the project (embedding, HNSW, pgvector, EXIF, JWT, etc.).
2. [Architecture](01-architecture.md) — how the pieces fit together right now.
3. [Decisions](decisions/README.md) — *why* we built it this way. ADRs (Architecture Decision Records).
4. The root [`PLAN.md`](../PLAN.md) — the 12-week, 6-phase build plan.
5. The root [`CLAUDE.md`](../CLAUDE.md) — conventions and the ten non-negotiables.
6. The root [`PROGRESS.csv`](../PROGRESS.csv) — live task tracker (opens in Excel).

## Index

| File | What it covers | Status |
| ---- | -------------- | ------ |
| `00-glossary.md` | Terms used in the codebase and decisions | Live |
| `01-architecture.md` | Current system architecture (Phase 1 state) | Live |
| `02-data-model.md` | The 9 tables and their relationships | Stub — write in Phase 2 |
| `03-face-pipeline.md` | Upload → detect → embed → match → approve | Stub — write in Phase 4 |
| `04-privacy-model.md` | The 10 non-negotiables, with examples | Stub — write when needed |
| `05-auth-flow.md` | Sign-up, enrollment, session, role-based access | Stub — write in Phase 2 |
| `decisions/` | ADRs for major architectural calls | 3 ADRs written so far |

## How to extend

Don't write directly. Ask the `project-tutor` agent — it has the template and the right voice. Direct edits are fine for fixing typos.
