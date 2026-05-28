# ADR-003: Next.js PWA for v1; native apps deferred to v2

**Status:** Accepted
**Date:** 2026-05-28
**Phase:** 1 (committed)

## Context

EventSnap is mobile-first. Most users will interact via phone:

- Guests take + upload photos.
- Photographers do bulk uploads (these may use laptops).
- Everyone scrolls galleries on phone.

Three plausible delivery models:

- **Native iOS + Android** (React Native, Flutter, or fully native).
- **Mobile-first PWA** (one Next.js codebase, installable to home screen).
- **Web-only**, no PWA install (just a responsive site).

Constraints:

- Solo founder, 12-week MVP target.
- No iOS or Android expertise on the team.
- Camera capture and photo uploads are core; both work fine in modern mobile browsers.
- App Store + Play Store review cycles are slow and unpredictable.

## Decision

**Single Next.js 15 codebase configured as a PWA.** Users can "Add to Home Screen" on both iOS and Android; UI is mobile-first; desktop is a secondary form factor.

Native React Native apps are an explicit v2, after revenue justifies the maintenance overhead.

## Consequences

**Enables:**
- One codebase, one deploy pipeline, one auth setup, one set of bugs to fix.
- No app store reviews. Ship fixes within minutes via Vercel.
- Web-search and link-sharing work naturally (a guest can WhatsApp a `/sign-up?event=ABC` link).
- The same code serves desktop photographers and mobile guests.

**Costs:**
- iOS PWA support is good but not perfect. Some quirks:
  - Push notifications via PWA on iOS require iOS 16.4+ (released March 2023, broadly available now).
  - Camera access via `<input capture>` works but isn't as smooth as a native camera UI.
  - PWA install banner on iOS is harder to surface than Android.
- App Store presence is a marketing signal we don't have until v2. Some users will look for "EventSnap" in the App Store and find nothing.

**Rules out:**
- Background processing on the user's device (e.g., warming up an upload queue while the user has the app closed). PWA capabilities are improving but not at native parity.
- Deep OS integration (sharing extensions, Siri shortcuts, etc.). Out of scope for MVP anyway.

## Alternatives considered

### React Native (single codebase, two stores)
- **Pro:** Shared business logic, native UI on both platforms.
- **Pro:** App Store presence from day one.
- **Con:** Three deploy targets (web + iOS + Android), three CI configurations, two store review cycles.
- **Con:** Author has no React Native experience. Learning curve eats 3–4 weeks of the 12-week budget.
- **Verdict:** Deferred to v2.

### Fully native (Swift + Kotlin)
- **Pro:** Best possible UX per platform.
- **Con:** Two codebases. With no native experience on the team and 12 weeks total, this is infeasible.
- **Verdict:** Rejected.

### Web-only (no PWA)
- **Pro:** Simplest possible.
- **Con:** No home-screen icon means lower retention. Photo capture and offline upload queue both benefit from PWA features.
- **Verdict:** Rejected. The PWA delta over plain web is small (just a manifest + service worker), and the retention gain is meaningful.

## References

- Code: `apps/web/public/manifest.webmanifest` (PWA manifest).
- Code: `apps/web/src/app/layout.tsx` (manifest link + viewport meta).
- Plan: `PLAN.md` — "Platform: mobile-first PWA for v1".

## Future re-evaluation triggers

- A paying customer explicitly asks for an App Store app (likely after first 5 events).
- Push notifications become essential to retention (Phase 5+ user behavior data will tell us).
- The web upload UX falls behind a native iOS camera-capture experience in a way users notice.
