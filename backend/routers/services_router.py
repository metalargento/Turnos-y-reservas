"""
Router de servicios.
Endpoints de CRUD para gestionar servicios del negocio.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.services import ServiceCreateRequest, ServiceUpdateRequest
from controllers.services_controller import services_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("services_router")

router = APIRouter(prefix="/api/services", tags=["Services"])
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extrae el token JWT del header."""
    return credentials.credentials


@router.get("/{business_id}")
async def list_services(
    business_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Lista servicios del negocio.
    Solo el owner puede ver sus servicios.
    """
    try:
        services = services_controller.list_services(token, business_id)
        return {"services": services, "count": len(services)}
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{business_id}", status_code=status.HTTP_201_CREATED)
async def create_service(
    business_id: str,
    request: ServiceCreateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Crea un nuevo servicio en el negocio.
    Solo el owner puede crear servicios.
    """
    try:
        service = services_controller.create_service(
            token=token,
            business_id=business_id,
            name=request.name,
            duration_minutes=request.duration_minutes,
            description=request.description,
            price=request.price,
        )
        return service
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{service_id}")
async def update_service(
    service_id: str,
    request: ServiceUpdateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Actualiza un servicio existente.
    Solo el owner puede editar sus servicios.
    """
    try:
        service = services_controller.update_service(
            token=token,
            service_id=service_id,
            name=request.name,
            duration_minutes=request.duration_minutes,
            description=request.description,
            price=request.price,
        )
        return service
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_service(
    service_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Desactiva un servicio (soft delete).
    Solo el owner puede desactivar sus servicios.
    """
    try:
        services_controller.deactivate_service(token, service_id)
        return None
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
