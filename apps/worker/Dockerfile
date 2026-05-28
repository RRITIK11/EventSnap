FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps for pillow + onnxruntime (added in Phase 4)
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libglib2.0-0 \
        libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY src ./src
RUN pip install -e .

EXPOSE 8000

# Default: HTTP service. Worker process is launched as a sibling container.
CMD ["uvicorn", "eventsnap_worker.main:app", "--host", "0.0.0.0", "--port", "8000"]
