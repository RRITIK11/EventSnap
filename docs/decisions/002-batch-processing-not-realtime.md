# ADR-002: Batch processing for face matching, not real-time

**Status:** Accepted
**Date:** 2026-05-28
**Phase:** 1 (committed) / 4 (implementation)

## Context

When a photo is uploaded, three things must happen:

1. Photo is stored durably (R2).
2. Faces are detected and embedded.
3. Matched users get notified / see the photo in their gallery.

The trade-off is **how quickly step 3 happens**:

- **Real-time** (seconds): user uploads, the match notification fires within 5–30 seconds. Big "wow" factor at an event.
- **Batch** (hours): jobs queue, worker processes them on its own schedule, photos appear in guests' galleries within a 6-hour SLA.
- **Hybrid**: low-res preview matches in seconds, full-res HD becomes available later.

Constraints:

- Solo founder, 2–3 month MVP target.
- $30–80/mo infra budget.
- Self-hosted InsightFace (ADR-001).

## Decision

**Batch processing only**, with a 6-hour SLA target. Jobs are enqueued on upload completion and consumed by a single-instance RQ worker.

## Consequences

**Enables:**
- One worker instance handles everything. No autoscaling needed for upload spikes (1,000 photos in 10 minutes during a wedding ceremony processes fine over the following hour or two).
- CPU inference is viable. ~5,000 photos process in ~30–60 minutes on a 4-vCPU box.
- Predictable infra cost. No "viral wedding" scenario where compute bills spike.
- Simpler error handling. If the worker is down for 30 minutes, jobs queue and resume — guests don't see error states.

**Costs:**
- No "wow" moment of receiving photos seconds after they're taken. We compete on accuracy + privacy, not speed.
- Worse demo experience for sales conversations ("Wait an hour to see results" is harder to pitch than "Watch them appear live").

**Rules out:**
- Live-event "your photo just appeared!" push notifications. Possible in v2 when we have revenue to justify the infra.

## Alternatives considered

### Real-time (websocket / SSE / push notifications, GPU-backed worker)
- **Pro:** Strongest UX. Guests at an event see their photos within seconds.
- **Con:** Requires GPU autoscaling for upload spikes — minimum ~$200/mo, more during real events.
- **Con:** Complex error recovery. Lost websockets, stuck retries, etc.
- **Con:** Out of scope for solo + 12-week MVP.
- **Verdict:** Deferred to v2.

### Hybrid (fast low-res preview + slow HD)
- **Pro:** Best of both — instant gratification + final quality.
- **Con:** Two separate processing pipelines, doubled code complexity.
- **Con:** Lower-res inference has lower recall; we'd be matching twice with two thresholds.
- **Verdict:** Deferred. Reconsider in v2 once we know whether batch is actually painful in practice.

## References

- Code: `apps/worker/src/eventsnap_worker/worker.py` (RQ consumer scaffold).
- Plan: `PLAN.md` — "Processing model: Batch, ≤ 6h SLA".
- Memory: `project_tech_decisions.md`.

## Future re-evaluation triggers

- Real customers ask for real-time (we'll know within the first 3 paying events).
- We hire a second engineer who can own the real-time path.
- A competitor ships real-time and it becomes a sales objection.
