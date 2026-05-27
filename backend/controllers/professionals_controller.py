"""
Controller de profesionales.
Orquesta operaciones de CRUD de profesionales.
"""
from typing import Dict, Any, List
from services.auth_service import auth_service
from repositories.business_repo import business_repo
from repositories.professional_repo import professional_repo
from utils.errors import AppError
from utils.logger import get_logger

logger = get_logger("professionals_controller")


class ProfessionalsController:
    """Gestiona CRUD de profesionales con verificación de ownership."""

    def __init__(self):
        self.professional_repo = professional_repo
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

    def list_professionals(self, token: str, business_id: str) -> List[Dict[str, Any]]:
        """Lista profesionales del negocio."""
        self._verify_ownership(token, business_id)
        professionals = self.professional_repo.find_by_business_id(business_id)
        logger.info(
            "Profesionales listados",
            extra={"business_id": business_id, "count": len(professionals)},
        )
        return professionals

    def create_professional(
        self,
        token: str,
        business_id: str,
        display_name: str,
        branch_id: str = None,
        avatar_url: str = None,
        bio: str = None,
    ) -> Dict[str, Any]:
        """Crea un nuevo profesional."""
        self._verify_ownership(token, business_id)

        professional = self.professional_repo.create(
            business_id=business_id,
            display_name=display_name,
            branch_id=branch_id,
            avatar_url=avatar_url,
            bio=bio,
        )
        logger.info(
            "Profesional creado",
            extra={"professional_id": professional["id"], "business_id": business_id},
        )
        return professional

    def update_professional(
        self,
        token: str,
        professional_id: str,
        display_name: str = None,
        branch_id: str = None,
        avatar_url: str = None,
        bio: str = None,
    ) -> Dict[str, Any]:
        """Actualiza un profesional."""
        professional = self.professional_repo.find_by_id(professional_id)
        if not professional:
            raise AppError("Profesional no encontrado", "PROFESSIONAL_NOT_FOUND", 404)

        self._verify_ownership(token, professional["business_id"])

        updated = self.professional_repo.update(
            professional_id=professional_id,
            display_name=display_name,
            branch_id=branch_id,
            avatar_url=avatar_url,
            bio=bio,
        )
        logger.info(
            "Profesional actualizado",
            extra={"professional_id": professional_id},
        )
        return updated

    def deactivate_professional(self, token: str, professional_id: str) -> bool:
        """Desactiva un profesional (soft delete)."""
        professional = self.professional_repo.find_by_id(professional_id)
        if not professional:
            raise AppError("Profesional no encontrado", "PROFESSIONAL_NOT_FOUND", 404)

        self._verify_ownership(token, professional["business_id"])

        self.professional_repo.set_active(professional_id, False)
        logger.info("Profesional desactivado", extra={"professional_id": professional_id})
        return True

    def assign_services(
        self, token: str, professional_id: str, service_ids: List[str]
    ) -> bool:
        """Asigna servicios a un profesional."""
        professional = self.professional_repo.find_by_id(professional_id)
        if not professional:
            raise AppError("Profesional no encontrado", "PROFESSIONAL_NOT_FOUND", 404)

        self._verify_ownership(token, professional["business_id"])

        self.professional_repo.assign_services(professional_id, service_ids)
        logger.info(
            "Servicios asignados",
            extra={"professional_id": professional_id, "count": len(service_ids)},
        )
        return True


professionals_controller = ProfessionalsController()
