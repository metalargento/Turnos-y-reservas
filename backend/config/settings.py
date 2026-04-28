"""
Configuración centralizada de la aplicación.
Único módulo que accede a variables de entorno.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Settings de la aplicación cargados desde variables de entorno."""

    # App
    app_env: str = "development"
    secret_key: str

    # Base de datos
    database_url: str

    # Autenticación JWT
    jwt_secret: str
    jwt_expiration_minutes: int = 60
    refresh_token_expiration_days: int = 30

    # Email transaccional (Resend)
    resend_api_key: Optional[str] = None
    email_from: str = "turnos@reservas.com"

    # Mercado Pago
    mercadopago_access_token: Optional[str] = None
    mercadopago_public_key: Optional[str] = None

    # Google Calendar
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: Optional[str] = None

    # Rate limiting
    rate_limit_per_minute: int = 60

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Frontend
    frontend_url: str = "http://localhost:5173"
    reservas_domain: str = "http://localhost:5174"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
