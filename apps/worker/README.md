# eventsnap-worker

Python service for EventSnap's face-recognition pipeline.

## Two processes

- **HTTP** (`main.py`): FastAPI app on port 8000 — health/ready probes, admin endpoints later.
- **Worker** (`worker.py`): RQ consumer pulling jobs from Redis.

Both share the same codebase and Docker image; the deploy chooses which command to run.

## Dev setup

```bash
cd apps/worker
python -m venv .venv
.venv/Scripts/activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -e ".[dev]"
cp .env.example .env

# Terminal 1: HTTP service
uvicorn eventsnap_worker.main:app --reload --port 8000

# Terminal 2: queue worker
python -m eventsnap_worker.worker
```

Visit http://localhost:8000/health.

## Phase 4 additions (not yet installed)

```toml
"insightface>=0.7",
"onnxruntime>=1.20",
"numpy>=2.0",
"opencv-python-headless>=4.10",
```

Uncomment in `pyproject.toml` when starting the face pipeline. Expect a ~500 MB install (onnxruntime + opencv).

## Models

InsightFace downloads model weights to `INSIGHTFACE_HOME` (`./.models` by default).
**Never commit `.models/`** — it's in `.gitignore`.
