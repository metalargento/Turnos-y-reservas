"""
Router de dashboard.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.dashboard import DashboardStats, UpcomingBooking, UniqueClient
from repositories.dashboard_repo import dashboard_repo
from repositories.business_repo import business_repo
from services.auth_service import auth_service
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("dashboard_router")

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    return credentials.credentials


@router.get("/{business_id}", response_model=DashboardStats)
async def get_dashboard_stats(
    business_id: str,
    token: str = Depends(get_current_user_token)
):
    """
    Obtiene las estadísticas del dashboard del negocio.

    Args:
        business_id: UUID del negocio
        token: Token JWT del usuario

    Returns:
        Estadísticas agregadas del negocio
    """
    # Verificar token
    try:
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]
    except AppError as e:
        raise e

    # Verificar que el negocio existe y pertenece al owner
    business = business_repo.find_by_id(business_id)
    if not business:
        raise AppError("Negocio no encontrado", code="BUSINESS_NOT_FOUND", status_code=404)
    if business["owner_id"] != owner_id:
        raise AppError(
            "No tenés acceso a este negocio",
            code="FORBIDDEN",
            status_code=403
        )

    # Obtener estadísticas y listas
    stats = dashboard_repo.get_stats(business_id)
    upcoming = dashboard_repo.get_upcoming_bookings(business_id)
    bookings_today = dashboard_repo.get_bookings_today(business_id)
    bookings_week = dashboard_repo.get_bookings_this_week(business_id)
    bookings_month = dashboard_repo.get_bookings_this_month(business_id)
    cancelled = dashboard_repo.get_cancelled_bookings(business_id)
    unique_clients = dashboard_repo.get_unique_clients(business_id)

    def format_booking(booking):
        return UpcomingBooking(
            id=booking["id"],
            client_name=booking["client_name"],
            professional_name=booking.get("professional_name"),
            service_name=booking.get("service_name"),
            starts_at=booking["starts_at"].isoformat() if hasattr(booking["starts_at"], "isoformat") else booking["starts_at"],
            status=booking.get("status", ""),
            cancellation_reason=booking.get("cancellation_reason")
        )

    def format_client(client):
        return UniqueClient(
            client_email=client["client_email"],
            client_name=client["client_name"],
            client_phone=client.get("client_phone"),
            booking_count=client.get("booking_count", 0)
        )

    return DashboardStats(
        bookings_today=stats.get("bookings_today", 0),
        bookings_this_week=stats.get("bookings_this_week", 0),
        bookings_this_month=stats.get("bookings_this_month", 0),
        cancelled_this_month=stats.get("cancelled_this_month", 0),
        unique_clients_this_month=stats.get("unique_clients_this_month", 0),
        upcoming_bookings=[format_booking(b) for b in upcoming],
        bookings_today_list=[format_booking(b) for b in bookings_today],
        bookings_this_week_list=[format_booking(b) for b in bookings_week],
        bookings_this_month_list=[format_booking(b) for b in bookings_month],
        cancelled_bookings_list=[format_booking(b) for b in cancelled],
        unique_clients_list=[format_client(c) for c in unique_clients]
    )
