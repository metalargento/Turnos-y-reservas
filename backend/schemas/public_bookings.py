"""
Schemas para endpoints públicos de bookings (sin autenticación).
"""
from pydantic import BaseModel, EmailStr, Field
from typing import List, Literal, Optional
from datetime import datetime


class PublicServiceItem(BaseModel):
    """Servicio reducido para información pública."""
    id: str
    name: str
    duration_minutes: int
    price: Optional[float] = None


class PublicProfessionalItem(BaseModel):
    """Profesional con servicios para información pública."""
    id: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    services: List[PublicServiceItem]


class PublicBusinessInfo(BaseModel):
    """Información de branding del negocio para el widget público."""
    id: str
    name: str
    slug: str
    rubro: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str
    min_advance_hours: int


class BusinessInfoResponse(BaseModel):
    """Respuesta GET /public/bookings/{slug}."""
    business: PublicBusinessInfo
    professionals: List[PublicProfessionalItem]


class AvailableDaysResponse(BaseModel):
    """Respuesta GET /public/bookings/{slug}/availability."""
    year: int
    month: int
    available_days: List[int] = Field(description="Días del mes con al menos un slot disponible")


class TimeSlot(BaseModel):
    """Slot horario con estado."""
    starts_at: str = Field(description="ISO 8601 timestamp")
    ends_at: str = Field(description="ISO 8601 timestamp")
    status: Literal['available', 'taken', 'blocked', 'past']


class SlotsResponse(BaseModel):
    """Respuesta GET /public/bookings/{slug}/slots."""
    date: str = Field(description="YYYY-MM-DD")
    duration_minutes: int
    slots: List[TimeSlot]


class PublicBookingCreateRequest(BaseModel):
    """Request POST /public/bookings/{slug}."""
    professional_id: str
    service_id: str
    branch_id: Optional[str] = None
    client_name: str = Field(min_length=2, max_length=100)
    client_email: EmailStr
    client_phone: Optional[str] = Field(None, max_length=20)
    client_notes: Optional[str] = Field(None, max_length=500)
    starts_at: str = Field(description="ISO 8601 timestamp")
    ends_at: str = Field(description="ISO 8601 timestamp")


class PublicBookingConfirmResponse(BaseModel):
    """Respuesta POST /public/bookings/{slug}."""
    message: str
    booking: dict = Field(description="BookingResponse full object")
