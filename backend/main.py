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
        response.headers.pop("server", None)  # Ocultar información del servidor
        return response


# Middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BaseHTTPMiddleware, dispatch=auth_middleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


# Health check
@app.get("/health")
async def health_check():
    """Endpoint de health check para monitoreo."""
    return {"status": "healthy", "version": "1.0.0"}


# Lifecycle events
@app.on_event("startup")
async def startup_event():
    """Inicializa la aplicación al arrancar."""
    logger.info("Iniciando aplicación...")
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
