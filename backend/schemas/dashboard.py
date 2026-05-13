"""
Schemas para el dashboard de estadísticas.
"""
from typing import List, Optional
from pydantic import BaseModel


class UpcomingBooking(BaseModel):
    """Reserva próxima para mostrar en el dashboard."""
    id: str
    client_name: str
    professional_name: Optional[str] = None
    service_name: Optional[str] = None
    starts_at: str


class DashboardStats(BaseModel):
    """Estadísticas del dashboard del negocio."""
    bookings_today: int
    bookings_this_week: int
    bookings_this_month: int
    cancelled_this_month: int
    unique_clients_this_month: int
    upcoming_bookings: List[UpcomingBooking]
