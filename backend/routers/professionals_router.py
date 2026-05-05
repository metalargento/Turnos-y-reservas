"""
Router de profesionales.
Endpoints de CRUD para gestionar profesionales del negocio.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.professionals import (
    ProfessionalCreateRequest,
    ProfessionalUpdateRequest,
    AssignServicesRequest,
)
from controllers.professionals_controller import professionals_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("professionals_router")

router = APIRouter(prefix="/api/professionals", tags=["Professionals"])
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extrae el token JWT del header."""
    return credentials.credentials


@router.get("/{business_id}")
async def list_professionals(
    business_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Lista profesionales del negocio.
    Solo el owner puede ver sus profesionales.
    """
    try:
        professionals = professionals_controller.list_professionals(token, business_id)
        return {"professionals": professionals, "count": len(professionals)}
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{business_id}", status_code=status.HTTP_201_CREATED)
async def create_professional(
    business_id: str,
    request: ProfessionalCreateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Crea un nuevo profesional en el negocio.
    Solo el owner puede crear profesionales.
    """
    try:
        professional = professionals_controller.create_professional(
            token=token,
            business_id=business_id,
            display_name=request.display_name,
            branch_id=request.branch_id,
            avatar_url=request.avatar_url,
            bio=request.bio,
        )
        return professional
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{professional_id}")
async def update_professional(
    professional_id: str,
    request: ProfessionalUpdateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Actualiza un profesional existente.
    Solo el owner puede editar sus profesionales.
    """
    try:
        professional = professionals_controller.update_professional(
            token=token,
            professional_id=professional_id,
            display_name=request.display_name,
            branch_id=request.branch_id,
            avatar_url=request.avatar_url,
            bio=request.bio,
        )
        return professional
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{professional_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_professional(
    professional_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Desactiva un profesional (soft delete).
    Solo el owner puede desactivar sus profesionales.
    """
    try:
        professionals_controller.deactivate_professional(token, professional_id)
        return None
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{professional_id}/services")
async def assign_services(
    professional_id: str,
    request: AssignServicesRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Asigna servicios a un profesional.
    Reemplaza la lista anterior. Puede ser una lista vacía para limpiar.
    Solo el owner puede asignar servicios.
    """
    try:
        professionals_controller.assign_services(
            token=token,
            professional_id=professional_id,
            service_ids=request.service_ids,
        )
        return {"message": "Servicios asignados correctamente"}
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
