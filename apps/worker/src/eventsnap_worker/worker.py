"""RQ worker entry point.

Run with:  python -m eventsnap_worker.worker

In Phase 4 this will register handlers for:
  - face_detect_and_match(photo_id)
  - enroll_user_face(user_id)
For now it just connects and idles, so we can verify Redis wiring end-to-end.
"""

from __future__ import annotations

import logging
import sys

from redis import Redis
from rq import Queue, Worker

from eventsnap_worker.config import settings

logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")
log = logging.getLogger("eventsnap.worker")


def main() -> int:
    log.info("connecting to redis at %s", settings.redis_url)
    redis = Redis.from_url(settings.redis_url)
    redis.ping()
    log.info("redis ok; starting worker on default queue")

    queue = Queue("default", connection=redis)
    worker = Worker([queue], connection=redis)
    worker.work(with_scheduler=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
