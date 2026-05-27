"""
Schemas para disponibilidad semanal (availability).
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from schemas.common import BaseSchema


class AvailabilityCreateRequest(BaseSchema):
    """Crear un horario de disponibilidad."""
    day_of_week: int = Field(ge=0, le=6)  # 0=Domingo, 1=Lunes... 6=Sábado
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")  # HH:MM
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")  # HH:MM

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        """Validar que el formato sea HH:MM válido."""
        try:
            hours, minutes = map(int, v.split(":"))
            if not (0 <= hours < 24) or not (0 <= minutes < 60):
                raise ValueError("Hora inválida")
        except (ValueError, TypeError):
            raise ValueError("El formato debe ser HH:MM")
        return v


class AvailabilityUpdateRequest(BaseSchema):
    """Actualizar horarios de disponibilidad."""
    start_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v: Optional[str]) -> Optional[str]:
        """Validar que el formato sea HH:MM válido."""
        if v is None:
            return v
        try:
            hours, minutes = map(int, v.split(":"))
            if not (0 <= hours < 24) or not (0 <= minutes < 60):
                raise ValueError("Hora inválida")
        except (ValueError, TypeError):
            raise ValueError("El formato debe ser HH:MM")
        return v


class AvailabilityResponse(BaseSchema):
    """Respuesta de disponibilidad."""
    id: str
    professional_id: str
    day_of_week: int
    start_time: str
    end_time: str
    is_active: bool
    created_at: Optional[str]


class AvailabilityListResponse(BaseSchema):
    """Respuesta con lista de disponibilidades."""
    availabilities: List[AvailabilityResponse]
    count: int
