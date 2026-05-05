"""
Schemas para reservas (bookings).
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from schemas.common import BaseSchema


class BookingCreateRequest(BaseSchema):
    """Crear una reserva."""
    professional_id: str
    service_id: str
    branch_id: Optional[str] = None
    client_name: str = Field(min_length=2, max_length=100)
    client_email: EmailStr
    client_phone: Optional[str] = Field(default=None, max_length=20)
    client_notes: Optional[str] = Field(default=None, max_length=500)
    starts_at: str = Field(description="ISO 8601 timestamp")
    ends_at: str = Field(description="ISO 8601 timestamp")
    payment_required: bool = Field(default=False)
    payment_amount: Optional[float] = Field(default=None, ge=0)


class BookingUpdateRequest(BaseSchema):
    """Actualizar datos de una reserva (no cancela)."""
    client_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    client_email: Optional[EmailStr] = None
    client_phone: Optional[str] = Field(default=None, max_length=20)
    client_notes: Optional[str] = Field(default=None, max_length=500)
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None


class BookingCancelRequest(BaseSchema):
    """Cancelar una reserva con motivo."""
    cancellation_reason: Optional[str] = Field(default=None, max_length=500)


class BookingResponse(BaseSchema):
    """Respuesta con datos de una reserva."""
    id: str
    business_id: str
    branch_id: Optional[str]
    professional_id: Optional[str]
    service_id: Optional[str]
    client_name: str
    client_email: str
    client_phone: Optional[str]
    client_notes: Optional[str]
    starts_at: str
    ends_at: str
    status: str
    cancelled_by: Optional[str]
    cancellation_reason: Optional[str]
    payment_required: bool
    payment_status: str
    payment_amount: Optional[float]
    payment_id: Optional[str]
    confirmation_token: str
    created_at: Optional[str]
    updated_at: Optional[str]


class BookingsListResponse(BaseSchema):
    """Respuesta con lista de reservas."""
    bookings: List[BookingResponse]
    count: int


class BookingConfirmResponse(BaseSchema):
    """Respuesta al confirmar una reserva con token."""
    message: str
    booking: BookingResponse
