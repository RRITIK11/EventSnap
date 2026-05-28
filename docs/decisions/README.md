# Architecture Decision Records (ADRs)

A short, dated note for every architectural call we make. The point: future-you (or a new contributor) reads this and understands *why* the codebase looks the way it does, without having to ask.

## Template

```markdown
# ADR-NNN: <decision in present tense>

**Status:** Accepted | Superseded by ADR-XXX | Rejected
**Date:** YYYY-MM-DD
**Phase:** N (per PLAN.md)

## Context
What problem are we solving? What constraints apply?

## Decision
The actual choice, in one or two sentences.

## Consequences
- What this enables.
- What this costs.
- What this rules out.

## Alternatives considered
- Alternative A — why we didn't choose it.
- Alternative B — why we didn't choose it.

## References
- Code: `path/to/file.ts:line`
- Conversation: `git log` SHA where this was decided.
- External: links to relevant docs.
```

## Index

| # | Title | Status | Date |
| - | ----- | ------ | ---- |
| [001](001-self-hosted-face-recognition.md) | Self-hosted face recognition (InsightFace) | Accepted | 2026-05-28 |
| [002](002-batch-processing-not-realtime.md) | Batch processing, not real-time, for face matching | Accepted | 2026-05-28 |
| [003](003-nextjs-pwa-not-native.md) | Next.js PWA for v1, native apps for v2 | Accepted | 2026-05-28 |

## ADRs to write (when their decisions become more than implicit)

- **004** — Postgres + pgvector instead of a dedicated vector DB.
- **005** — JWT sessions instead of database sessions.
- **006** — Cloudflare R2 instead of AWS S3.
- **007** — Drizzle ORM instead of Prisma.
- **008** — tus.io resumable uploads instead of plain multipart (when implemented in Phase 4).
- **009** — Hand-edited migrations instead of fully-generated.
- **010** — Multi-stakeholder single-product instead of separate organizer/guest apps.
