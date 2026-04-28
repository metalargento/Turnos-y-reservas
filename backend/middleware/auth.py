"""
Middleware de autenticación JWT.
Verifica tokens en requests y agrega el usuario al estado de la request.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from config.settings import settings
from utils.logger import logger


# Rutas públicas que no requieren autenticación
PUBLIC_ROUTES = [
    "/health",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/verify-token",
]

# Rutas públicas de reservas (cliente final sin cuenta)
PUBLIC_BOOKING_ROUTES = [
    "/api/bookings/public",
    "/api/bookings/confirm",
    "/api/bookings/cancel",
    "/api/bookings/reschedule",
]


def is_public_route(path: str) -> bool:
    """Verifica si una ruta es pública (no requiere autenticación)."""
    if path in PUBLIC_ROUTES:
        return True
    # Verificar rutas de bookings públicos
    for public_route in PUBLIC_BOOKING_ROUTES:
        if path.startswith(public_route):
            return True
    return False


def verify_token(token: str) -> dict:
    """
    Verifica un token JWT y devuelve el payload.

    Raises:
        JWTError: Si el token es inválido o expiró
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"]
        )
        return payload
    except JWTError as e:
        logger.warning("Token inválido", extra={"error": str(e)})
        raise


async def auth_middleware(request: Request, call_next):
    """
    Middleware que verifica autenticación en cada request.

    - Rutas públicas: pasan sin verificar
    - Rutas protegidas: requieren token válido en header Authorization
    """
    # Verificar si es ruta pública
    if is_public_route(request.url.path):
        return await call_next(request)

    # Obtener token del header
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

    if not token:
        return JSONResponse(
            status_code=401,
            content={"error": True, "message": "No autorizado", "code": "MISSING_TOKEN"}
        )

    # Verificar token
    try:
        payload = verify_token(token)
        request.state.user = payload
    except JWTError:
        return JSONResponse(
            status_code=401,
            content={"error": True, "message": "No autorizado", "code": "INVALID_TOKEN"}
        )

    return await call_next(request)
