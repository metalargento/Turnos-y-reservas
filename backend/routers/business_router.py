"""
Router para gestionar datos del negocio.
Endpoints para actualizar información básica del negocio.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.business import BusinessUpdateRequest
from controllers.business_controller import business_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("business_router")

router = APIRouter(prefix="/api/business", tags=["Business"])
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extrae el token JWT del header."""
    return credentials.credentials


@router.put("/{business_id}")
async def update_business(
    business_id: str,
    request: BusinessUpdateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Actualiza datos básicos del negocio (name, rubro, description).
    Solo el owner del negocio puede actualizar.
    """
    try:
        business = business_controller.update_business(
            token=token,
            business_id=business_id,
            name=request.name,
            rubro=request.rubro,
            description=request.description,
        )
        return business
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
