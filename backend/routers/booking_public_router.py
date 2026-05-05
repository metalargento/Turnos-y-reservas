"""
Router público para reservas (bookings).
Endpoints sin autenticación para clientes finales.
"""
from fastapi import APIRouter, HTTPException, status
from schemas.bookings import (
    BookingCancelRequest,
    BookingResponse,
    BookingConfirmResponse,
)
from controllers.booking_controller import booking_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("booking_public_router")

# Usar prefijo /public para que sea claramente público
router = APIRouter(prefix="/public/bookings", tags=["Bookings - Public"])


@router.get("/confirm/{confirmation_token}", response_model=BookingResponse)
async def get_booking_by_token(confirmation_token: str):
    """
    Obtener detalles de una reserva usando token de confirmación.

    El cliente final usa este endpoint para ver su reserva sin iniciar sesión.
    """
    try:
        return booking_controller.get_booking_by_token(confirmation_token)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/confirm/{confirmation_token}/cancel", response_model=BookingConfirmResponse)
async def cancel_booking_by_token(
    confirmation_token: str,
    request: BookingCancelRequest,
):
    """
    Cancelar una reserva usando token de confirmación.

    El cliente final puede cancelar su reserva sin tener una cuenta,
    solo necesita el token recibido en el email de confirmación.

    Registra que fue cancelada por "client".
    """
    try:
        booking = booking_controller.cancel_booking_by_token(
            confirmation_token=confirmation_token,
            cancellation_reason=request.cancellation_reason,
        )
        return {
            "message": "Tu reserva ha sido cancelada exitosamente",
            "booking": booking,
        }
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
