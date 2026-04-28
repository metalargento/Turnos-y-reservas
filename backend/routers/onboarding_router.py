"""
Router de onboarding.
Endpoints para los 5 pasos del wizard de activación del negocio.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from schemas.onboarding import (
    BusinessStepRequest,
    BrandStepRequest,
    BranchStepRequest,
    ServicesStepRequest,
    AgendaStepRequest,
    OnboardingProgressResponse,
    OnboardingCompleteResponse,
    ServiceItemRequest
)
from controllers.onboarding_controller import onboarding_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("onboarding_router")

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

# Security scheme para endpoints protegidos
security = HTTPBearer()


async def get_current_user_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Dependency que extrae el token JWT del header."""
    return credentials.credentials


@router.post("/step-1", status_code=status.HTTP_201_CREATED)
async def step_1_create_business(
    request: BusinessStepRequest,
    token: str = Depends(get_current_user_token)
):
    """
    Paso 1: Crear el negocio.

    El owner registra el nombre, rubro y descripción del negocio.
    Se genera automáticamente un slug único para la URL pública.

    **Importante:** Este endpoint devuelve un business_id que debés usar
    en los siguientes pasos.
    """
    try:
        result = onboarding_controller.step_1_create_business(
            token=token,
            name=request.name,
            rubro=request.rubro,
            description=request.description
        )
        return result
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/step-2/{business_id}")
async def step_2_update_brand(
    business_id: str,
    request: BrandStepRequest,
    token: str = Depends(get_current_user_token)
):
    """
    Paso 2: Configurar marca del negocio.

    Actualiza el logo y colores de la marca. Estos datos se usarán
    en la página pública de reservas para mostrar la marca del negocio.

    - `primary_color`: Color principal (botones, headers)
    - `secondary_color`: Color secundario (fondos, detalles)
    - `logo_url`: URL del logo (opcional)
    """
    try:
        # Verificar que el usuario es owner del negocio
        # (esto se podría hacer en el controller también)
        from services.auth_service import auth_service
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        from repositories.business_repo import business_repo
        business = business_repo.find_by_id(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso para este negocio")

        result = onboarding_controller.step_2_update_brand(
            business_id=business_id,
            logo_url=request.logo_url,
            primary_color=request.primary_color,
            secondary_color=request.secondary_color
        )
        return result
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/step-3/{business_id}", status_code=status.HTTP_201_CREATED)
async def step_3_create_branch(
    business_id: str,
    request: BranchStepRequest,
    token: str = Depends(get_current_user_token)
):
    """
    Paso 3: Crear la primera sucursal.

    Registra la primera sucursal del negocio. En el futuro se podrán
    agregar más sucursales desde el panel de administración.

    - `branch_name`: Nombre de la sucursal (ej: "Casa central")
    - `address`: Dirección física (opcional)
    - `phone`: Teléfono de contacto (opcional)
    """
    try:
        from services.auth_service import auth_service
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        from repositories.business_repo import business_repo
        business = business_repo.find_by_id(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso para este negocio")

        result = onboarding_controller.step_3_create_branch(
            business_id=business_id,
            branch_name=request.branch_name,
            address=request.address,
            phone=request.phone
        )
        return result
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/step-4/{business_id}", status_code=status.HTTP_201_CREATED)
async def step_4_create_services(
    business_id: str,
    request: ServicesStepRequest,
    token: str = Depends(get_current_user_token)
):
    """
    Paso 4: Crear servicios del negocio.

    Registra los servicios que ofrece el negocio. Cada servicio tiene:
    - `name`: Nombre del servicio
    - `duration_minutes`: Duración en minutos (15-480)
    - `price`: Precio opcional (para cobro online)
    - `description`: Descripción opcional

    **Mínimo 1 servicio obligatorio. Sin límite máximo.**
    """
    try:
        from services.auth_service import auth_service
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        from repositories.business_repo import business_repo
        business = business_repo.find_by_id(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso para este negocio")

        # Convertir los servicios a formato que espera el controller
        services_data = [
            {
                "name": s.name,
                "duration_minutes": s.duration_minutes,
                "description": s.description,
                "price": s.price
            }
            for s in request.services
        ]

        result = onboarding_controller.step_4_create_services(
            business_id=business_id,
            services_data=services_data
        )
        return {"services": result, "count": len(result)}
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.put("/step-5/{business_id}")
async def step_5_update_agenda(
    business_id: str,
    request: AgendaStepRequest,
    token: str = Depends(get_current_user_token)
):
    """
    Paso 5: Configurar agenda y notificaciones.

    Último paso del onboarding. Configura:
    - `min_advance_hours`: Horas mínimas de anticipación para reservar
    - `email_provider`: 'resend' (default) o 'smtp' propio
    - `smtp_*`: Configuración SMTP (si usa smtp propio)
    - `google_calendar_enabled`: Activar integración con Google Calendar

    Al completar este paso, el negocio queda **activo** y puede recibir reservas.
    """
    try:
        from services.auth_service import auth_service
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        from repositories.business_repo import business_repo
        business = business_repo.find_by_id(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso para este negocio")

        result = onboarding_controller.step_5_update_agenda_config(
            business_id=business_id,
            min_advance_hours=request.min_advance_hours,
            email_provider=request.email_provider,
            smtp_host=request.smtp_host,
            smtp_port=request.smtp_port,
            smtp_user=request.smtp_user,
            smtp_password=request.smtp_password,
            google_calendar_enabled=request.google_calendar_enabled
        )
        return {
            **result,
            "message": "Onboarding completado. Tu negocio está activo."
        }
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{business_id}/progress", response_model=OnboardingProgressResponse)
async def get_onboarding_progress(
    business_id: str,
    token: str = Depends(get_current_user_token)
):
    """
    Obtiene el progreso del onboarding de un negocio.

    Devuelve:
    - `onboarding_completed`: True si completó todos los pasos
    - `steps_completed`: Lista de pasos completados
    - `steps_pending`: Lista de pasos pendientes
    - `next_step`: Próximo paso a completar
    """
    try:
        from services.auth_service import auth_service
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        from repositories.business_repo import business_repo
        business = business_repo.find_by_id(business_id)
        if not business:
            raise HTTPException(status_code=404, detail="Negocio no encontrado")
        if business["owner_id"] != owner_id:
            raise HTTPException(status_code=403, detail="No tenés permiso para este negocio")

        result = onboarding_controller.get_progress(business_id)
        return result
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/my-business")
async def get_my_business(
    token: str = Depends(get_current_user_token)
):
    """
    Obtiene el negocio del usuario autenticado.

    Útil para redirigir al usuario a su negocio después del login.
    Si no tiene negocio, devuelve null.
    """
    try:
        from services.auth_service import auth_service
        payload = auth_service.verify_token(token)
        owner_id = payload["sub"]

        from repositories.business_repo import business_repo
        businesses = business_repo.find_by_owner_id(owner_id)

        if not businesses:
            return {"business": None, "has_business": False}

        return {
            "business": businesses[0],
            "has_business": True
        }
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
