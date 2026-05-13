"""Schemas para operaciones del negocio."""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from schemas.common import BaseSchema
import re


class BusinessUpdateRequest(BaseSchema):
    """Actualizar datos básicos del negocio (name, rubro, description)."""
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    rubro: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=500)

    @field_validator("name", "rubro")
    @classmethod
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = re.sub(r'[<>"\'\\]', '', v)
        return v.strip()
