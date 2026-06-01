"""
Handler global de errores.
Captura todas las excepciones y devuelve respuestas JSON consistentes.
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from utils.logger import logger
from utils.errors import AppError


async def global_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler global que captura todas las excepciones.

    - AppError: errores esperados → mensaje legible, código interno
    - Exception: errores inesperados → log completo, mensaje genérico al cliente
    """
    origin = request.headers.get("origin", "")

    # Agregar headers CORS a respuestas de error
    def add_cors_headers(response, origin):
        if "vercel.app" in origin or "localhost" in origin:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        return response

    if isinstance(exc, AppError):
        # Error esperado de la aplicación
        logger.warning(
            exc.message,
            extra={"code": exc.code, "path": str(request.url.path)}
        )
        response = JSONResponse(
            status_code=exc.status_code,
            content={"error": True, "message": exc.message, "code": exc.code}
        )
        return add_cors_headers(response, origin)

    # Error inesperado — loguear completo pero no exponer detalles
    logger.error(
        "Error inesperado",
        extra={
            "error": str(exc),
            "path": str(request.url.path),
            "method": request.method
        }
    )
    response = JSONResponse(
        status_code=500,
        content={"error": True, "message": "Error interno del servidor", "code": "INTERNAL_ERROR"}
    )
    return add_cors_headers(response, origin)
