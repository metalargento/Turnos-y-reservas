"""
Schemas de servicios.
Solicitudes y respuestas para CRUD de servicios del negocio.
"""
from pydantic import BaseModel, Field
from typing import Optional
from schemas.common import BaseSchema


class ServiceCreateRequest(BaseSchema):
    """Crear un nuevo servicio."""
    name: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    duration_minutes: int = Field(ge=15, le=480)
    price: Optional[float] = Field(default=None, ge=0)


class ServiceUpdateRequest(BaseSchema):
    """Actualizar un servicio."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    duration_minutes: Optional[int] = Field(default=None, ge=15, le=480)
    price: Optional[float] = Field(default=None, ge=0)
