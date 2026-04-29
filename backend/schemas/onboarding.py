"""
Schemas del flujo de onboarding del negocio.
5 pasos: negocio, marca, sucursal, servicios, configuración.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from schemas.common import BaseSchema
import re


# ============================================
# Paso 1: Datos del negocio
# ============================================

class BusinessStepRequest(BaseSchema):
    """Paso 1: Datos básicos del negocio."""
    name: str = Field(min_length=2, max_length=100)
    rubro: str = Field(min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name", "rubro")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Sanitizar texto - remover caracteres especiales."""
        v = re.sub(r'[<>"\'\\]', '', v)
        return v.strip()


# ============================================
# Paso 2: Marca del negocio
# ============================================

class BrandStepRequest(BaseSchema):
    """Paso 2: Configuración de marca."""
    logo_url: Optional[str] = Field(default=None, max_length=500)
    primary_color: str = Field(default="#000000", pattern="^#[0-9A-Fa-f]{6}$")
    secondary_color: str = Field(default="#FFFFFF", pattern="^#[0-9A-Fa-f]{6}$")


# ============================================
# Paso 3: Primera sucursal
# ============================================

class BranchStepRequest(BaseSchema):
    """Paso 3: Datos de la primera sucursal."""
    branch_name: str = Field(min_length=2, max_length=100)
    address: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=20)

    @field_validator("branch_name")
    @classmethod
    def sanitize_branch_name(cls, v: str) -> str:
        """Sanitizar nombre de sucursal."""
        v = re.sub(r'[<>"\'\\]', '', v)
        return v.strip()


# ============================================
# Paso 4: Servicios
# ============================================

class ServiceItemRequest(BaseSchema):
    """Un servicio individual dentro de la lista de servicios."""
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    duration_minutes: int = Field(ge=15, le=480)  # De 15 min a 8 horas
    price: Optional[float] = Field(default=None, ge=0)

    @field_validator("name")
    @classmethod
    def sanitize_service_name(cls, v: str) -> str:
        """Sanitizar nombre de servicio."""
        v = re.sub(r'[<>"\'\\]', '', v)
        return v.strip()


class ServicesStepRequest(BaseSchema):
    """Paso 4: Lista de servicios del negocio."""
    services: List[ServiceItemRequest] = Field(min_length=1)


# ============================================
# Paso 5: Configuración de agenda
# ============================================

class EmailProvider(str):
    """Proveedor de email: 'resend' o 'smtp'."""
    pass


class AgendaStepRequest(BaseSchema):
    """Paso 5: Configuración de agenda y notificaciones."""
    min_advance_hours: int = Field(default=1, ge=0, le=72)
    email_provider: str = Field(default="resend")
    smtp_host: Optional[str] = Field(default=None, max_length=200)
    smtp_port: Optional[int] = Field(default=None, ge=1, le=65535)
    smtp_user: Optional[str] = Field(default=None, max_length=200)
    smtp_password: Optional[str] = Field(default=None, max_length=200)
    google_calendar_enabled: bool = Field(default=False)

    @field_validator("email_provider")
    @classmethod
    def validate_email_provider(cls, v: str) -> str:
        """Validar proveedor de email."""
        if v not in ("resend", "smtp"):
            raise ValueError("email_provider debe ser 'resend' o 'smtp'")
        return v


# ============================================
# Respuestas de onboarding
# ============================================

class OnboardingProgressResponse(BaseSchema):
    """Respuesta con el progreso del onboarding."""
    business_id: str
    onboarding_completed: bool
    steps_completed: List[str]
    steps_pending: List[str]
    next_step: str


class OnboardingCompleteResponse(BaseSchema):
    """Respuesta de onboarding completado."""
    business_id: str
    slug: str
    message: str = "Onboarding completado exitosamente"


class OnboardingStatusResponse(BaseSchema):
    """Estado completo del onboarding."""
    business_id: str
    onboarding_completed: bool
    step_1_business: bool
    step_2_brand: bool
    step_3_branch: bool
    step_4_services: bool
    step_5_agenda: bool
