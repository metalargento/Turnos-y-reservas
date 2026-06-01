"""
Middleware de autenticación JWT.
Verifica tokens en requests y agrega el usuario al estado de la request.
"""
from fastapi import Request, HTTPException
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
    "/public",  # Todos los endpoints bajo /public son públicos (bookings)
]


def is_public_route(path: str) -> bool:
    """Verifica si una ruta es pública (no requiere autenticación)."""
    # Verificar rutas exactas
    if path in PUBLIC_ROUTES:
        return True
    # Verificar rutas que comienzan con prefijos públicos
    for public_route in PUBLIC_ROUTES:
        if path.startswith(public_route):
            return True
    return False


def verify_token(request: Request) -> dict:
    """
    Verifica un token JWT del header Authorization y devuelve el payload.

    Raises:
        HTTPException: Si el token no se encuentra o es inválido
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

    if not token:
        raise HTTPException(status_code=401, detail="Token no encontrado")

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"]
        )
        return payload
    except JWTError as e:
        logger.warning("Token inválido", extra={"error": str(e)})
        raise HTTPException(status_code=401, detail="Token inválido")


async def auth_middleware(request: Request, call_next):
    """
    Middleware que verifica autenticación en cada request.

    - Rutas públicas: pasan sin verificar
    - Rutas protegidas: requieren token válido en header Authorization
    """
    # Permitir solicitudes OPTIONS (preflight CORS)
    if request.method == "OPTIONS":
        return await call_next(request)

    # Verificar si es ruta pública
    if is_public_route(request.url.path):
        return await call_next(request)

    # Helper para agregar headers CORS a respuesta de error
    def add_cors_headers(response, origin):
        if "vercel.app" in origin or "localhost" in origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        return response

    origin = request.headers.get("origin", "")

    # Obtener token del header
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header.startswith("Bearer ") else ""

    if not token:
        response = JSONResponse(
            status_code=401,
            content={"error": True, "message": "No autorizado", "code": "MISSING_TOKEN"}
        )
        return add_cors_headers(response, origin)

    # Verificar token
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        request.state.user = payload
    except JWTError:
        response = JSONResponse(
            status_code=401,
            content={"error": True, "message": "No autorizado", "code": "INVALID_TOKEN"}
        )
        return add_cors_headers(response, origin)

    return await call_next(request)
