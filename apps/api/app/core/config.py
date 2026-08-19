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
    # Owner used for public repo auto-sync when no GITHUB_TOKEN is configured.
    github_owner: str = ""
    ai_provider: str = "demo"
    openai_api_key: str = ""
    ai_model: str = ""
    # OpenAI-compatible base URL (works with Groq, OpenRouter, etc.)
    ai_base_url: str = "https://api.openai.com/v1"
    # When set, write endpoints require this key (Authorization: Bearer or X-API-Key).
    # Empty = auth disabled (local development only). Set it for any public deployment.
    api_key: str = ""
    # JWT secret key for token signing (auto-generated if not set).
    jwt_secret_key: str = ""
    # The owner's email — used for identity display (who is allowed to make changes).
    owner_email: str = ""
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    cache_ttl_seconds: int = 30
    # Optional SMTP for the contact form (e.g. Gmail app password).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
