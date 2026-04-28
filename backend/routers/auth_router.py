"""
Router de autenticación.
Endpoints de registro, login, refresh y verificación de tokens.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshTokenRequest,
    AuthResponse,
    TokenRefreshResponse,
    UserResponse
)
from controllers.auth_controller import auth_controller
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("auth_router")

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

# Security scheme para endpoints protegidos
security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency que extrae el user_id del token JWT.

    Returns:
        user_id extraído del payload del token
    """
    from services.auth_service import auth_service

    try:
        payload = auth_service.verify_token(credentials.credentials)
        return payload["sub"]
    except AppError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """
    Registra un nuevo usuario (owner o professional).

    El usuario recibe access_token y refresh_token inmediatamente después del registro.
    """
    try:
        result = auth_controller.register(
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            role=request.role
        )
        return result
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Inicia sesión de un usuario existente.

    Devuelve access_token y refresh_token si las credenciales son válidas.
    """
    try:
        result = auth_controller.login(
            email=request.email,
            password=request.password
        )
        return result
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Genera nuevos tokens usando un refresh token válido.

    Implementa rotación de tokens — el refresh token anterior se invalida.
    """
    try:
        result = auth_controller.refresh_tokens(refresh_token=request.refresh_token)
        return {
            "access_token": result["access_token"],
            "refresh_token": result["refresh_token"],
            "token_type": result["token_type"]
        }
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/me", response_model=UserResponse)
async def get_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Obtiene datos del usuario autenticado.

    Requiere token JWT válido en el header Authorization.
    """
    try:
        user = auth_controller.get_current_user(user_id)
        return user
    except AppError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/verify-token")
async def verify_token(token: str):
    """
    Verifica si un token es válido.

    Endpoint público para validar tokens del cliente final (confirmación de reservas).
    """
    from services.auth_service import auth_service

    try:
        payload = auth_service.verify_token(token)
        return {"valid": True, "payload": {"sub": payload["sub"], "type": payload.get("type")}}
    except AppError:
        return {"valid": False}
