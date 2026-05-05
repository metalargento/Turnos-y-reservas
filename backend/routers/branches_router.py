"""
Router de sucursales.
Endpoints de CRUD para gestionar sucursales del negocio.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.branches import BranchCreateRequest, BranchUpdateRequest
from controllers.branches_controller import branches_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("branches_router")

router = APIRouter(prefix="/api/branches", tags=["Branches"])
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Extrae el token JWT del header."""
    return credentials.credentials


@router.get("/{business_id}")
async def list_branches(
    business_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Lista sucursales del negocio.
    Solo el owner puede ver sus sucursales.
    """
    try:
        branches = branches_controller.list_branches(token, business_id)
        return {"branches": branches, "count": len(branches)}
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{business_id}", status_code=status.HTTP_201_CREATED)
async def create_branch(
    business_id: str,
    request: BranchCreateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Crea una nueva sucursal en el negocio.
    Solo el owner puede crear sucursales.
    """
    try:
        branch = branches_controller.create_branch(
            token=token,
            business_id=business_id,
            name=request.name,
            address=request.address,
            phone=request.phone,
        )
        return branch
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/{branch_id}")
async def update_branch(
    branch_id: str,
    request: BranchUpdateRequest,
    token: str = Depends(get_current_user_token),
):
    """
    Actualiza una sucursal existente.
    Solo el owner puede editar sus sucursales.
    """
    try:
        branch = branches_controller.update_branch(
            token=token,
            branch_id=branch_id,
            name=request.name,
            address=request.address,
            phone=request.phone,
        )
        return branch
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.delete("/{branch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_branch(
    branch_id: str,
    token: str = Depends(get_current_user_token),
):
    """
    Desactiva una sucursal (soft delete).
    Solo el owner puede desactivar sus sucursales.
    """
    try:
        branches_controller.deactivate_branch(token, branch_id)
        return None
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
