import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base paths derived dynamically
    BACKEND_DIR: Path = Path(__file__).resolve().parent
    ROOT_DIR: Path = BACKEND_DIR.parent
    ML_DIR: Path = ROOT_DIR / "stock_prediction_ml"
    ARTIFACTS_DIR: Path = ML_DIR / "artifacts"
    OUTPUTS_DIR: Path = ML_DIR / "outputs"
    DB_PATH: Path = BACKEND_DIR / "stockstreak.db"

    # Server Settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # ML & Stock Settings
    DEFAULT_TICKER: str = "RELIANCE.NS"
    SKIP_TIMESFM_BY_DEFAULT: bool = False
    DEFAULT_PERIOD: str = "5y"
    DEFAULT_HORIZON: int = 5

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
