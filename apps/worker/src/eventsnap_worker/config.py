"""Runtime configuration loaded from environment."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    redis_url: str = "redis://localhost:6379"

    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = "eventsnap-photos"

    # Face matching threshold (cosine distance). Lower = stricter. Tune per real data.
    face_match_threshold: float = 0.40

    # Path where insightface caches model weights. Never commit weights to git.
    insightface_home: str = "./.models"

    log_level: str = "INFO"


settings = Settings()  # type: ignore[call-arg]
