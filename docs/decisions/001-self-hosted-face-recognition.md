# ADR-001: Self-hosted face recognition with InsightFace

**Status:** Accepted
**Date:** 2026-05-28
**Phase:** 1 (decision committed) / 4 (implementation)

## Context

EventSnap's core feature is face-based photo distribution. We must:

1. Detect faces in uploaded photos.
2. Generate a comparable representation (embedding) per face.
3. Match those embeddings against enrolled user faces.

Three plausible approaches:

- **Cloud API** — AWS Rekognition, Azure Face, Face++. Pay per call.
- **Self-hosted open source** — InsightFace, DeepFace, face-api.js. Pay for compute only.
- **On-device** — Run face detection in the user's browser/phone. Cheapest infra but limits centralized matching.

Constraints unique to EventSnap:

- We hold **biometric data** for thousands of users. Vendor lock-in on the most sensitive data we'll ever have is a long-term risk.
- Founder is solo, on a $30–80/mo MVP infra budget. Cloud API costs scale linearly with photos uploaded — predictable but uncapped.
- Compliance posture matters from day one (DPDP / GDPR / BIPA all treat face embeddings as sensitive). Self-hosted = full control over data residency and retention.

## Decision

**Self-hosted InsightFace** (Python, `buffalo_l` model pack — RetinaFace detection + ArcFace 512-d embeddings). Run on CPU at MVP scale. GPU rented from Vast.ai or RunPod if/when sustained throughput requires it.

Storage: Postgres + pgvector for embeddings.

## Consequences

**Enables:**
- Flat compute cost regardless of volume. ~$20/month for the CPU worker box covers ~10 events/month × ~5,000 photos.
- Full control over the matching threshold, false-positive/false-negative trade-off, and model version.
- No vendor can shut us down, deprecate the API, or hike pricing.
- Embeddings never leave our infrastructure — strongest possible privacy posture.

**Costs:**
- Operational complexity. We deploy and run the worker; we own its uptime.
- Slower iteration. Cloud APIs have managed model upgrades; we choose when to upgrade `buffalo_l` and absorb the migration cost.
- Initial accuracy tuning is on us. Threshold of 0.4 cosine distance is a starting point; real-event data will require adjustment.
- GPU cost when we scale — but only when, not from day one.

**Rules out:**
- Multi-cloud "swap providers" portability — we'd have to re-embed everyone if we switched to AWS Rekognition (their embedding format is proprietary).

## Alternatives considered

### AWS Rekognition / Azure Face / Face++ (cloud API)
- **Pro:** Zero infra to run. ~95% recall out of the box.
- **Con:** $0.0010–$0.0015 per image processed. At 10 events × 5,000 photos × 3 faces avg = 150k ops/month → $150–225/mo, 5× our self-hosted cost. Scales linearly.
- **Con:** Vendor lock-in on the embeddings — they're not portable.
- **Con:** Biometric data leaves our control. Compliance review per region becomes harder.
- **Verdict:** Rejected. Cost discipline matters more than time-to-first-match for a solo founder.

### face-api.js (on-device, browser-side)
- **Pro:** Zero server cost. Privacy is maximized — face data never leaves the user's device.
- **Con:** We can't do centralized matching across photographers' uploads if matching only happens on each guest's device. Defeats the core feature (photographer uploads 5,000 photos → guests get auto-matched).
- **Verdict:** Rejected. Architecturally incompatible with the core flow.

### DeepFace (alternative Python lib)
- **Pro:** Pure-Python, easy install.
- **Con:** Looser packaging; uses several model backends inconsistently. InsightFace is the de-facto standard for production face recognition pipelines.
- **Verdict:** Rejected. InsightFace has better recall on hard cases (low light, partial occlusion) per public benchmarks.

## References

- Code: `apps/worker/pyproject.toml` (dependencies declared but InsightFace not yet installed — Phase 4).
- Code: `apps/worker/src/eventsnap_worker/config.py:25` (`face_match_threshold: float = 0.40`).
- Memory: `project_tech_decisions.md` ("Locked decisions" section).
- Conversation: scoping conversation 2026-05-28.

## Future re-evaluation triggers

We should revisit this ADR if:

- Sustained processing > 50,000 photos/day on CPU — at that point a managed service may be cheaper than running our own GPU.
- A regulator explicitly requires a SOC-2-attested face-recognition vendor (some EU procurement scenarios).
- InsightFace becomes unmaintained (currently active as of 2026).
