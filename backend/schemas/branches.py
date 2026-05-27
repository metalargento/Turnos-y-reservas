"""
Schemas de sucursales.
Solicitudes y respuestas para CRUD de sucursales del negocio.
"""
from pydantic import BaseModel, Field
from typing import Optional
from schemas.common import BaseSchema


class BranchCreateRequest(BaseSchema):
    """Crear una nueva sucursal."""
    name: str = Field(min_length=2, max_length=100)
    address: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=20)


class BranchUpdateRequest(BaseSchema):
    """Actualizar una sucursal."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    address: Optional[str] = Field(default=None, max_length=200)
    phone: Optional[str] = Field(default=None, max_length=20)
