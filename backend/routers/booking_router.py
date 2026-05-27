"""
Router para reservas (bookings).
Endpoints para crear, listar, actualizar y cancelar reservas.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.bookings import (
    BookingCreateRequest,
    BookingUpdateRequest,
    BookingCancelRequest,
    BookingResponse,
    BookingsListResponse,
    BookingConfirmResponse,
)
from controllers.booking_controller import booking_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("booking_router")

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Dependency que extrae el token JWT del header."""
    return credentials.credentials


# ============================================
# Endpoints Autenticados (Admin/Owner)
# ============================================


@router.post("/{business_id}", status_code=status.HTTP_201_CREATED, response_model=BookingResponse)
async def create_booking(
    business_id: str,
    request: BookingCreateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Crear una reserva.

    Validaciones:
    - El profesional pertenece al negocio
    - No hay conflictos de horario
    - No hay bloqueos en el período

    Se genera automáticamente un token único para que el cliente pueda
    cancelar/reprogramar sin crear una cuenta.
    """
    try:
        return booking_controller.create_booking(
            token=token,
            business_id=business_id,
            professional_id=request.professional_id,
            service_id=request.service_id,
            branch_id=request.branch_id,
            client_name=request.client_name,
            client_email=request.client_email,
            client_phone=request.client_phone,
            client_notes=request.client_notes,
            starts_at=request.starts_at,
            ends_at=request.ends_at,
            payment_required=request.payment_required,
            payment_amount=request.payment_amount,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{business_id}", response_model=BookingsListResponse)
async def list_bookings(
    business_id: str,
    token: str = Depends(get_current_user_token),
    status: str = Query(None, description="Filtrar por estado: confirmed, cancelled, rescheduled, completed"),
    start_date: str = Query(None, description="Fecha inicial (ISO 8601)"),
    end_date: str = Query(None, description="Fecha final (ISO 8601)"),
):
    """
    Listar reservas de un negocio.

    Filtros opcionales:
    - `status`: Estado de la reserva
    - `start_date`: Reservas desde esta fecha
    - `end_date`: Reservas hasta esta fecha
    """
    try:
        return booking_controller.list_bookings(
            token=token,
            business_id=business_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{business_id}/{booking_id}", response_model=BookingResponse)
async def get_booking(
    business_id: str,
    booking_id: str,
    token: str = Depends(get_current_user_token),
):
    """Obtener detalles de una reserva específica."""
    try:
        return booking_controller.get_booking(token=token, booking_id=booking_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    request: BookingUpdateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Actualizar datos de una reserva.

    Campos opcionales:
    - Datos del cliente (nombre, email, teléfono, notas)
    - Horario (con validación de disponibilidad)

    No cancela la reserva, solo actualiza sus datos.
    """
    try:
        return booking_controller.update_booking(
            token=token,
            booking_id=booking_id,
            client_name=request.client_name,
            client_email=request.client_email,
            client_phone=request.client_phone,
            client_notes=request.client_notes,
            starts_at=request.starts_at,
            ends_at=request.ends_at,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(
    booking_id: str,
    request: BookingCancelRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Cancelar una reserva (como admin/owner).

    Registra que fue cancelada por "admin" y opcionalmente guarda el motivo.
    """
    try:
        booking_controller.cancel_booking(
            token=token,
            booking_id=booking_id,
            cancellation_reason=request.cancellation_reason,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)




# ============================================
# Endpoints Públicos (Cliente Final)
# ============================================


