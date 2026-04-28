"""
Logger centralizado de la aplicación.
Formato JSON estructurado para integración con CloudWatch u otros sistemas.
"""
import logging
import json
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """Formatter que produce logs en JSON estructurado."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }

        # Agregar datos extra si existen
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # Agregar stack trace en errores
        if record.exc_info:
            log_data["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


# Configurar logger global
logger = logging.getLogger("app")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Obtener un logger con nombre específico (para módulos)."""
    child_logger = logging.getLogger(f"app.{name}")
    child_logger.handlers = []
    child_logger.addHandler(handler)
    child_logger.setLevel(logging.INFO)
    return child_logger
