"""
Punto de entrada de la aplicación FastAPI.
Solo configuración de la app y registro de middleware/routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from config.settings import settings
from utils.logger import logger
from utils.db import db
from middleware.error_handler import global_error_handler
from middleware.auth import auth_middleware

# Routers
from routers.auth_router import router as auth_router
from routers.onboarding_router import router as onboarding_router
from routers.business_router import router as business_router
from routers.services_router import router as services_router
from routers.branches_router import router as branches_router
from routers.professionals_router import router as professionals_router
from routers.availability_router import router as availability_router, blocks_router as schedule_blocks_router
from routers.booking_router import router as booking_router
from routers.booking_public_router import router as booking_public_router
from routers.dashboard_router import router as dashboard_router
from migrations.run_migrations import run_migrations


# Crear aplicación
app = FastAPI(
    title="Sistema de Turnos y Reservas",
    description="API para gestión de turnos y reservas de negocios",
    version="1.0.0"
)

# Registrar handler global de errores
app.add_exception_handler(Exception, global_error_handler)


# Middleware de headers de seguridad
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega headers de seguridad HTTP a todas las respuestas."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if "server" in response.headers:
            del response.headers["server"]
        return response


# Custom CORS middleware que acepta cualquier vercel.app
class FlexibleCORSMiddleware(BaseHTTPMiddleware):
    """CORS middleware que acepta localhost, vercel.app, y origins configurados."""

    async def dispatch(self, request, call_next):
        from fastapi.responses import Response

        origin = request.headers.get("origin", "")

        # Orígenes permitidos
        allowed_origins = settings.allowed_origins.split(",")

        # Verificar si el origen está permitido o es vercel.app
        is_allowed = (
            origin in allowed_origins or
            "vercel.app" in origin or
            "localhost" in origin
        )

        # Manejar preflight requests (OPTIONS)
        if request.method == "OPTIONS":
            if is_allowed:
                return Response(
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                        "Access-Control-Allow-Headers": "Authorization, Content-Type",
                    },
                )
            return Response(status_code=200)

        response = await call_next(request)

        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"

        return response


# Middlewares (se ejecutan en orden inverso al que se agregan)
# CORS primero, luego seguridad, luego auth
app.add_middleware(FlexibleCORSMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BaseHTTPMiddleware, dispatch=auth_middleware)


# Health check
@app.get("/health")
async def health_check():
    """Endpoint de health check para monitoreo."""
    return {"status": "healthy", "version": "1.0.1"}


# Lifecycle events
@app.on_event("startup")
async def startup_event():
    """Inicializa la aplicación al arrancar."""
    logger.info("Iniciando aplicación...")
    run_migrations()
    db.connect()
    logger.info("Aplicación iniciada correctamente")


@app.on_event("shutdown")
async def shutdown_event():
    """Limpia recursos al cerrar la aplicación."""
    logger.info("Cerrando aplicación...")
    db.disconnect()
    logger.info("Aplicación cerrada")


# Health check
@app.get("/")
async def root():
    """Root endpoint - información básica de la API."""
    return {
        "name": "Sistema de Turnos y Reservas API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# Registrar routers
app.include_router(auth_router)
app.include_router(onboarding_router)
app.include_router(business_router)
app.include_router(services_router)
app.include_router(branches_router)
app.include_router(professionals_router)
app.include_router(availability_router)
app.include_router(schedule_blocks_router)
app.include_router(booking_router)
app.include_router(booking_public_router)
app.include_router(dashboard_router)
