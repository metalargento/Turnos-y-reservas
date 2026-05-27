"""
Schemas de profesionales.
Solicitudes y respuestas para CRUD de profesionales del negocio.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from schemas.common import BaseSchema


class ProfessionalCreateRequest(BaseSchema):
    """Crear un nuevo profesional."""
    display_name: str = Field(min_length=2, max_length=100)
    branch_id: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=500)


class ProfessionalUpdateRequest(BaseSchema):
    """Actualizar un profesional."""
    display_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    branch_id: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=500)


class AssignServicesRequest(BaseSchema):
    """Asignar servicios a un profesional."""
    service_ids: List[str] = Field(default_factory=list)
