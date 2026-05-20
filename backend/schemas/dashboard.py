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
    status: str
    cancellation_reason: Optional[str] = None


class UniqueClient(BaseModel):
    """Cliente único con su información y cantidad de reservas."""
    client_email: str
    client_name: str
    client_phone: Optional[str] = None
    booking_count: int


class DashboardStats(BaseModel):
    """Estadísticas del dashboard del negocio."""
    bookings_today: int
    bookings_this_week: int
    bookings_this_month: int
    cancelled_this_month: int
    unique_clients_this_month: int
    upcoming_bookings: List[UpcomingBooking]
    bookings_today_list: List[UpcomingBooking]
    bookings_this_week_list: List[UpcomingBooking]
    bookings_this_month_list: List[UpcomingBooking]
    cancelled_bookings_list: List[UpcomingBooking]
    unique_clients_list: List[UniqueClient]
