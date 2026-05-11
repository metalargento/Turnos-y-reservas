"""
Router público para reservas (bookings).
Endpoints sin autenticación para clientes finales.
"""
from fastapi import APIRouter, HTTPException, status, Query
from schemas.bookings import (
    BookingCancelRequest,
    BookingResponse,
    BookingConfirmResponse,
)
from schemas.public_bookings import (
    BusinessInfoResponse,
    AvailableDaysResponse,
    SlotsResponse,
    PublicBookingCreateRequest,
    PublicBookingConfirmResponse,
)
from controllers.booking_controller import booking_controller
from controllers.public_booking_controller import public_booking_controller
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


# ============================================
# Endpoints del Widget Público
# ============================================


@router.get("/{slug}", response_model=BusinessInfoResponse)
async def get_business_info(slug: str):
    """
    Obtener información del negocio con sus profesionales y servicios.

    Entrada principal del widget de reservas público.
    Retorna datos para el Paso 1 (seleccionar profesional + servicio).
    """
    try:
        return public_booking_controller.get_business_info(slug)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{slug}/availability", response_model=AvailableDaysResponse)
async def get_available_days(
    slug: str,
    professional_id: str = Query(..., description="UUID del profesional"),
    service_id: str = Query(..., description="UUID del servicio"),
    year: int = Query(..., description="Año (ej: 2026)"),
    month: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
):
    """
    Obtener días del mes que tienen slots disponibles para un profesional + servicio.

    Utilizado en el Paso 2 (seleccionar día en calendario).
    Retorna lista de números de días (1-31) que tienen al menos un slot disponible.
    """
    try:
        return public_booking_controller.get_available_days(
            slug, professional_id, service_id, year, month
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{slug}/slots", response_model=SlotsResponse)
async def get_slots_for_date(
    slug: str,
    professional_id: str = Query(..., description="UUID del profesional"),
    service_id: str = Query(..., description="UUID del servicio"),
    date: str = Query(..., description="Fecha en formato YYYY-MM-DD"),
):
    """
    Obtener slots (franjas horarias) disponibles para un día específico.

    Utilizado en el Paso 3 (seleccionar hora).
    Retorna lista de slots con su status: available, taken, blocked, past.
    """
    try:
        return public_booking_controller.get_slots_for_date(
            slug, professional_id, service_id, date
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{slug}", status_code=status.HTTP_201_CREATED, response_model=PublicBookingConfirmResponse)
async def create_public_booking(
    slug: str,
    request: PublicBookingCreateRequest,
):
    """
    Crear una reserva pública sin autenticación.

    Validaciones:
    - Anticipación mínima (min_advance_hours del negocio)
    - Profesional pertenece al negocio
    - Sin conflictos con otras reservas (confirmed/rescheduled)
    - Sin bloqueos (schedule_blocks)

    Retorna confirmación con token único para que el cliente pueda cancelar/ver su reserva.

    Error 409: El slot fue tomado entre la selección y el submit (race condition).
    """
    try:
        return public_booking_controller.create_public_booking(
            slug=slug,
            professional_id=request.professional_id,
            service_id=request.service_id,
            branch_id=request.branch_id,
            starts_at=request.starts_at,
            ends_at=request.ends_at,
            client_name=request.client_name,
            client_email=request.client_email,
            client_phone=request.client_phone,
            client_notes=request.client_notes,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{slug}/cancel", response_model=PublicBookingConfirmResponse)
async def cancel_public_booking(
    slug: str,
    booking_id: str = Query(..., description="UUID de la reserva a cancelar"),
    client_email: str = Query(..., description="Email del cliente"),
    client_name: str = Query(..., description="Nombre del cliente"),
):
    """
    Cancelar una reserva pública usando email + nombre.

    El cliente no necesita token, solo proporciona:
    - El ID de la reserva
    - Su email
    - Su nombre

    Se valida que email y nombre coincidan antes de cancelar.
    """
    try:
        return public_booking_controller.cancel_public_booking(
            slug=slug,
            booking_id=booking_id,
            client_email=client_email,
            client_name=client_name,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
