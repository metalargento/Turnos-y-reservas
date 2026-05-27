"""
Router para disponibilidad y bloqueos de agenda.
Endpoints para configurar horarios semanales y bloqueos manuales de profesionales.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.availability import (
    AvailabilityCreateRequest,
    AvailabilityUpdateRequest,
    AvailabilityListResponse,
)
from schemas.schedule_blocks import (
    ScheduleBlockCreateRequest,
    ScheduleBlocksListResponse,
)
from controllers.availability_controller import availability_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("availability_router")

router = APIRouter(prefix="/api/availability", tags=["Availability"])
blocks_router = APIRouter(prefix="/api/schedule-blocks", tags=["Schedule Blocks"])

security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Dependency que extrae el token JWT del header."""
    return credentials.credentials


# ============================================
# Availability (horarios semanales)
# ============================================


@router.get("/{professional_id}", response_model=AvailabilityListResponse)
async def list_availability(
    professional_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Listar horarios de disponibilidad de un profesional.

    Devuelve todos los horarios regulares (lunes a domingo).
    """
    try:
        return availability_controller.list_availability(token, professional_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{professional_id}", status_code=status.HTTP_201_CREATED)
async def create_availability(
    professional_id: str,
    request: AvailabilityCreateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Crear un horario de disponibilidad.

    - `day_of_week`: 0=Domingo, 1=Lunes, ..., 6=Sábado
    - `start_time`: Formato HH:MM (ej: "09:00")
    - `end_time`: Formato HH:MM (ej: "18:00")

    Cada día puede tener múltiples franjas horarias.
    """
    try:
        return availability_controller.create_availability(
            token=token,
            professional_id=professional_id,
            day_of_week=request.day_of_week,
            start_time=request.start_time,
            end_time=request.end_time,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{availability_id}")
async def update_availability(
    availability_id: str,
    request: AvailabilityUpdateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Actualizar un horario de disponibilidad.

    Campos opcionales:
    - `start_time`: Nueva hora de inicio (HH:MM)
    - `end_time`: Nueva hora de fin (HH:MM)
    """
    try:
        return availability_controller.update_availability(
            token=token,
            availability_id=availability_id,
            start_time=request.start_time,
            end_time=request.end_time,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{availability_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_availability(
    availability_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Desactivar un horario de disponibilidad.

    No se elimina realmente (soft delete), pero deja de contar para
    calcular disponibilidad futura.
    """
    try:
        availability_controller.delete_availability(token, availability_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


# ============================================
# Schedule Blocks (bloqueos manuales)
# ============================================


@blocks_router.get("/{professional_id}", response_model=ScheduleBlocksListResponse)
async def list_schedule_blocks(
    professional_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Listar bloqueos de agenda de un profesional.

    Devuelve todas las vacaciones, feriados, ausencias, etc.
    """
    try:
        return availability_controller.list_schedule_blocks(token, professional_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@blocks_router.post("/{professional_id}", status_code=status.HTTP_201_CREATED)
async def create_schedule_block(
    professional_id: str,
    request: ScheduleBlockCreateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Crear un bloqueo de agenda.

    - `blocked_from`: Inicio del bloqueo (ISO 8601 timestamp)
    - `blocked_until`: Fin del bloqueo (ISO 8601 timestamp)
    - `reason`: Motivo del bloqueo (opcional: "Vacaciones", "Feriado", etc)

    El profesional NO estará disponible entre estas fechas.
    """
    try:
        return availability_controller.create_schedule_block(
            token=token,
            professional_id=professional_id,
            blocked_from=request.blocked_from,
            blocked_until=request.blocked_until,
            reason=request.reason,
        )
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@blocks_router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule_block(
    block_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Eliminar un bloqueo de agenda.

    El profesional volverá a estar disponible en ese período.
    """
    try:
        availability_controller.delete_schedule_block(token, block_id)
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
