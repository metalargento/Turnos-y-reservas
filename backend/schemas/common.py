"""
Schemas comunes y respuestas estándar de la API.
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


# ============================================
# Respuestas de error
# ============================================

class ErrorResponse(BaseModel):
    """Formato estándar de respuesta de error."""
    error: bool = True
    message: str
    code: str


# ============================================
# Respuestas estándar
# ============================================

class SuccessResponse(BaseModel):
    """Respuesta estándar de éxito."""
    success: bool = True
    message: str


class PaginatedResponse(BaseModel):
    """Respuesta paginada estándar."""
    data: list[Any]
    total: int
    page: int = 1
    page_size: int = 20
    has_more: bool = False


# ============================================
# Schema base para otros schemas
# ============================================

class BaseSchema(BaseModel):
    """Clase base para todos los schemas con configuración común."""

    class Config:
        from_attributes = True
        str_strip_whitespace = True


# ============================================
# Tokens de autenticación
# ============================================

class TokenResponse(BaseModel):
    """Respuesta de login con tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    """Request para refresh de token."""
    refresh_token: str
