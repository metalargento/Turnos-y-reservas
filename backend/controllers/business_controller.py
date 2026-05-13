"""
Controller para gestionar datos del negocio.
Orquesta operaciones de actualización del negocio.
"""
from typing import Dict, Any, Optional
from services.auth_service import auth_service
from repositories.business_repo import business_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("business_controller")


class BusinessController:
    """Gestiona operaciones del negocio con verificación de ownership."""

    def __init__(self):
        self.business_repo = business_repo
        self.auth_service = auth_service

    def _verify_ownership(self, token: str, business_id: str) -> str:
        """Verifica que el usuario es dueño del negocio."""
        payload = self.auth_service.verify_token(token)
        owner_id = payload["sub"]

        business = self.business_repo.find_by_id(business_id)
        if not business:
            raise AppError("Negocio no encontrado", "BUSINESS_NOT_FOUND", 404)
        if business["owner_id"] != owner_id:
            raise AppError(
                "No tenés permiso para este negocio",
                "FORBIDDEN",
                403,
            )
        return owner_id

    def update_business(
        self,
        token: str,
        business_id: str,
        name: Optional[str] = None,
        rubro: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Actualiza datos básicos del negocio."""
        self._verify_ownership(token, business_id)

        # Construir dict de actualizaciones solo con campos no-None
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if rubro is not None:
            update_data["rubro"] = rubro
        if description is not None:
            update_data["description"] = description

        if not update_data:
            # Si no hay campos para actualizar, devolver el negocio actual
            return self.business_repo.find_by_id(business_id)

        logger.info(
            f"Actualizando negocio {business_id}",
            extra={"fields": list(update_data.keys())},
        )

        updated = self.business_repo.update(business_id, update_data)
        return updated


business_controller = BusinessController()
