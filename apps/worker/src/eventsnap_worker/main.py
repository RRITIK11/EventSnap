"""FastAPI healthcheck + admin endpoints for the worker service.

The actual job processing runs in a separate RQ worker process (see worker.py).
This HTTP service exists so the host (Hetzner / Fly / Render) can probe liveness
and so the Next.js app can enqueue jobs without speaking Redis directly when
that's preferred.
"""

from fastapi import FastAPI

from eventsnap_worker import __version__

app = FastAPI(title="EventSnap Worker", version=__version__)


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "service": "worker", "version": __version__}


@app.get("/ready")
def ready() -> dict[str, object]:
    # Phase 4: probe Redis + Postgres connections here.
    return {"ready": True}
