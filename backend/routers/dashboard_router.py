"""
Router de dashboard.
"""
from fastapi import APIRouter, Depends
from schemas.dashboard import DashboardStats, UpcomingBooking
from repositories.dashboard_repo import dashboard_repo
from repositories.business_repo import business_repo
from middleware.auth import verify_token
from utils.errors import AppError

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/{business_id}", response_model=DashboardStats)
async def get_dashboard_stats(
    business_id: str,
    token: dict = Depends(verify_token)
):
    """
    Obtiene las estadísticas del dashboard del negocio.

    Args:
        business_id: UUID del negocio
        token: Token JWT del usuario

    Returns:
        Estadísticas agregadas del negocio
    """
    # Verificar que el negocio existe y pertenece al owner
    business = business_repo.find_by_id(business_id)
    if not business:
        raise AppError("Negocio no encontrado", code="BUSINESS_NOT_FOUND", status_code=404)

    owner_id = token.get("sub")
    if business["owner_id"] != owner_id:
        raise AppError(
            "No tenés acceso a este negocio",
            code="FORBIDDEN",
            status_code=403
        )

    # Obtener estadísticas
    stats = dashboard_repo.get_stats(business_id)
    upcoming = dashboard_repo.get_upcoming_bookings(business_id)

    # Formatear próximas reservas
    formatted_upcoming = [
        UpcomingBooking(
            id=booking["id"],
            client_name=booking["client_name"],
            professional_name=booking["professional_name"],
            service_name=booking["service_name"],
            starts_at=booking["starts_at"].isoformat() if hasattr(booking["starts_at"], "isoformat") else booking["starts_at"]
        )
        for booking in upcoming
    ]

    return DashboardStats(
        bookings_today=stats.get("bookings_today", 0),
        bookings_this_week=stats.get("bookings_this_week", 0),
        bookings_this_month=stats.get("bookings_this_month", 0),
        cancelled_this_month=stats.get("cancelled_this_month", 0),
        unique_clients_this_month=stats.get("unique_clients_this_month", 0),
        upcoming_bookings=formatted_upcoming
    )
