"""
Schemas de autenticación.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
import re
from schemas.common import BaseSchema


# ============================================
# Requests de registro y login
# ============================================

class RegisterRequest(BaseSchema):
    """Request para registro de usuario (owner o professional)."""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    role: str = Field(..., pattern="^(owner|professional)$")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validar que la password tenga al menos una mayúscula y un número."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe tener al menos una letra mayúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        """Sanitizar nombre - remover caracteres especiales."""
        v = re.sub(r'[<>"\'\\]', '', v)
        return v.strip()


class LoginRequest(BaseSchema):
    """Request para login de usuario."""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseSchema):
    """Request para refresh de token."""
    refresh_token: str


# ============================================
# Respuestas de autenticación
# ============================================

class UserResponse(BaseSchema):
    """Respuesta con datos de usuario (sin datos sensibles)."""
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool


class AuthResponse(BaseSchema):
    """Respuesta de login/registro exitoso."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenRefreshResponse(BaseSchema):
    """Respuesta de refresh de token."""
    access_token: str
    token_type: str = "bearer"
