"""
Controller de servicios.
Orquesta operaciones de CRUD de servicios.
"""
from typing import Dict, Any, List
from services.auth_service import auth_service
from repositories.business_repo import business_repo
from repositories.service_repo import service_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("services_controller")


class ServicesController:
    """Gestiona CRUD de servicios con verificación de ownership."""

    def __init__(self):
        self.service_repo = service_repo
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

    def list_services(self, token: str, business_id: str) -> List[Dict[str, Any]]:
        """Lista servicios del negocio."""
        self._verify_ownership(token, business_id)
        services = self.service_repo.find_by_business_id(business_id)
        logger.info(
            "Servicios listados",
            extra={"business_id": business_id, "count": len(services)},
        )
        return services

    def create_service(
        self, token: str, business_id: str, name: str, duration_minutes: int,
        description: str = None, price: float = None
    ) -> Dict[str, Any]:
        """Crea un nuevo servicio."""
        self._verify_ownership(token, business_id)

        service = self.service_repo.create(
            business_id=business_id,
            name=name,
            duration_minutes=duration_minutes,
            description=description,
            price=price,
        )
        logger.info(
            "Servicio creado",
            extra={"service_id": service["id"], "business_id": business_id},
        )
        return service

    def update_service(
        self, token: str, service_id: str, name: str = None,
        duration_minutes: int = None, description: str = None, price: float = None
    ) -> Dict[str, Any]:
        """Actualiza un servicio."""
        service = self.service_repo.find_by_id(service_id)
        if not service:
            raise AppError("Servicio no encontrado", "SERVICE_NOT_FOUND", 404)

        self._verify_ownership(token, service["business_id"])

        updated = self.service_repo.update(
            service_id=service_id,
            name=name,
            description=description,
            duration_minutes=duration_minutes,
            price=price,
        )
        logger.info(
            "Servicio actualizado",
            extra={"service_id": service_id},
        )
        return updated

    def deactivate_service(self, token: str, service_id: str) -> bool:
        """Desactiva un servicio (soft delete)."""
        service = self.service_repo.find_by_id(service_id)
        if not service:
            raise AppError("Servicio no encontrado", "SERVICE_NOT_FOUND", 404)

        self._verify_ownership(token, service["business_id"])

        self.service_repo.set_active(service_id, False)
        logger.info("Servicio desactivado", extra={"service_id": service_id})
        return True


services_controller = ServicesController()
