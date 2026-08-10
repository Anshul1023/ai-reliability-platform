from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "AI Reliability Platform"
    environment: str = "development"
    demo_mode: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/reliability"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: str = "http://localhost:5173"
    github_token: str = ""
    github_api_url: str = "https://api.github.com"
    ai_provider: str = "demo"
    openai_api_key: str = ""
    ai_model: str = ""
    # When set, write endpoints require this key (Authorization: Bearer or X-API-Key).
    # Empty = auth disabled (local development only). Set it for any public deployment.
    api_key: str = ""
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    cache_ttl_seconds: int = 30
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
